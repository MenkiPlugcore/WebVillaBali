#!/usr/bin/env python3
"""Local, interactive export coordinator. It never restores or changes production."""
import argparse,datetime,getpass,hashlib,json,os,pathlib,re,shutil,subprocess,sys,tempfile
PROJECT='tvcmwkzwemrwwewphfgh'
ROOT=pathlib.Path(__file__).resolve().parents[2]
APP_TABLES=['developer_grants','guest_moments','inquiries','locations','motorbike_images','motorbikes','properties','property_images','services','site_settings','staff_activity','testimonials']
PRIVATE_TABLES=['inquiry_limits','inquiry_requests','staff_account_requests']
def run(args,**kwargs):
    # Do not echo CLI stderr: errors from credentialed programs may include secrets.
    result=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,**kwargs)
    if result.returncode: raise RuntimeError('Perintah lokal gagal: '+pathlib.Path(args[0]).name+'. Detail kredensial tidak dicetak.')
    return result.stdout

def preflight():
    missing=[x for x in ['node','supabase','docker','psql','gpg'] if not shutil.which(x)]
    print('Belum tersedia: '+', '.join(missing) if missing else 'Node, Supabase CLI, Docker, psql, dan GPG tersedia.')
    if missing:return False
    major=int(run(['node','--version']).decode().strip().lstrip('v').split('.')[0])
    if major<22:raise RuntimeError('Node.js minimal versi 22.')
    help_text=run(['supabase','db','dump','--help']).decode()
    if any(flag not in help_text for flag in ['--linked','--file','--role-only','--data-only','--use-copy','--schema']):raise RuntimeError('CLI tidak mendukung opsi dump yang diperlukan; periksa versi CLI resmi.')
    run(['docker','info','--format','{{.ServerVersion}}'])
    print('Docker aktif dan opsi CLI sesuai. Ini hanya pengecekan alat, belum membuat backup.')
    return True

def coverage(folder):
    schema=(folder/'schema.sql').read_text().replace('"','')
    data=(folder/'data.sql').read_text().replace('"','')
    expected=['public.'+x for x in APP_TABLES]+['aup_private.'+x for x in PRIVATE_TABLES]
    # Check dump statements, rather than names mentioned in comments or row values.
    identifier=r'([a-z_][a-z0-9_]*\.[a-z_][a-z0-9_]*)'
    schema_tables=set(re.findall(r'^\s*CREATE\s+(?:UNLOGGED\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?'+identifier+r'\s*\(',schema,re.M|re.I))
    data_tables=set(re.findall(r'^\s*(?:COPY|INSERT\s+INTO)\s+(?:ONLY\s+)?'+identifier+r'\s*(?:\(|FROM\b|VALUES\b)',data,re.M|re.I))
    if any(x not in schema_tables or x not in data_tables for x in expected):raise RuntimeError('Dump aplikasi belum mencakup seluruh tabel yang diperlukan.')
    return {'application_tables':expected,'auth_users_in_data':'auth.users' in data_tables,'auth_mfa_in_data':'auth.mfa_factors' in data_tables,'storage_metadata_in_data':'storage.objects' in data_tables}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=['preflight','backup'])
    parser.add_argument('--output',type=pathlib.Path)
    args=parser.parse_args();os.umask(0o077)
    if not preflight():return 1
    if args.action=='preflight':return 0
    if not sys.stdin.isatty():raise RuntimeError('Jalankan backup langsung dari terminal interaktif agar kredensial tidak terbaca dari pipe.')
    if args.output is None:raise RuntimeError('Pilih --output di luar folder repository.')
    destination=args.output.expanduser().resolve()
    if destination==ROOT or ROOT in destination.parents:raise RuntimeError('Simpan backup di luar repository.')
    linked=ROOT/'supabase'/'.temp'/'project-ref'
    if not linked.exists() or linked.read_text().strip()!=PROJECT:raise RuntimeError('Jalankan supabase login dan supabase link --project-ref '+PROJECT+' di repository ini terlebih dahulu.')
    destination.mkdir(mode=0o700,parents=True,exist_ok=True)
    password=getpass.getpass('Password DATABASE Supabase (tersembunyi, bukan password login panel): ')
    storage_key=getpass.getpass('Server secret/service_role Supabase (tersembunyi): ')
    if not password or not storage_key:raise RuntimeError('Kredensial belum diisi.')
    started=datetime.datetime.now(datetime.timezone.utc).isoformat()
    stage=pathlib.Path(tempfile.mkdtemp(prefix='aup-incomplete-',dir=destination))
    environment=os.environ.copy();environment['SUPABASE_DB_PASSWORD']=password
    try:
        jobs=[('roles.sql',['--role-only']),('schema.sql',['--schema','public,aup_private']),('data.sql',['--data-only','--use-copy','--exclude','storage.buckets_vectors','--exclude','storage.vector_indexes'])]
        for filename,flags in jobs:
            print('Ekspor '+filename+'…',flush=True)
            run(['supabase','db','dump','--linked','--file',str(stage/filename),*flags],cwd=ROOT,env=environment)
        checks=coverage(stage)
        if not checks['auth_users_in_data'] or not checks['auth_mfa_in_data']:raise RuntimeError('Dump belum mencakup data Auth. Hasil belum lengkap; periksa cakupan CLI sebelum melanjutkan.')
        print('Unduh foto privat…',flush=True)
        run(['node',str(ROOT/'backend/backup/media.mjs'),'export',str(stage/'media')],cwd=ROOT,input=json.dumps({'key':storage_key}).encode())
        run(['node',str(ROOT/'backend/backup/media.mjs'),'verify',str(stage/'media')],cwd=ROOT)
        files={str(p.relative_to(stage)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(stage.rglob('*')) if p.is_file()}
        manifest={'version':1,'project_ref':PROJECT,'started_at':started,'completed_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'coverage':checks,'sha256':files,'restore_verified':False,'offsite_copy_verified':False,'notes':'Separate database dump jobs and media listing; not a single cross-service snapshot. Avoid content changes during export.'}
        (stage/'backup-manifest.json').write_text(json.dumps(manifest,indent=2))
        archive=destination/('aup-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'.tar.gz')
        shutil.make_archive(str(archive)[:-7],'gztar',root_dir=stage)
        encrypted=pathlib.Path(str(archive)+'.gpg')
        print('GPG akan meminta passphrase enkripsi. Simpan passphrase terpisah dari backup.',flush=True)
        subprocess.run(['gpg','--symmetric','--cipher-algo','AES256','--output',str(encrypted),str(archive)],check=True)
        if not encrypted.is_file() or encrypted.stat().st_size==0:raise RuntimeError('Arsip terenkripsi belum terbentuk.')
        encrypted.with_suffix(encrypted.suffix+'.sha256').write_text(hashlib.sha256(encrypted.read_bytes()).hexdigest()+'  '+encrypted.name+'\n')
        # Originals are removed only after successful encryption; no production data is deleted.
        archive.unlink();shutil.rmtree(stage)
        print('Ekspor terenkripsi selesai: '+str(encrypted))
        print('Belum diuji restore atau disalin off-site. Tahap pemulihan belum selesai.')
    except Exception:
        print('Ekspor belum selesai. Berkas sementara privat mungkin tersisa di '+str(stage),file=sys.stderr)
        raise
    finally:
        environment.pop('SUPABASE_DB_PASSWORD',None)
        password=storage_key=''
    return 0
if __name__=='__main__':
    try:sys.exit(main())
    except RuntimeError as error:
        print(str(error),file=sys.stderr);sys.exit(1)
    except (Exception,KeyboardInterrupt):
        print('Proses dihentikan/gagal. Tidak ada kredensial dicetak. Jangan anggap backup telah berhasil.',file=sys.stderr);sys.exit(1)

