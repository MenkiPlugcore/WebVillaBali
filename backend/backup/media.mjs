import {mkdir,writeFile,readFile,lstat} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const PROJECT='tvcmwkzwemrwwewphfgh',BUCKET='aup-media',MAX_SIZE=8*1024*1024;
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const signature=rows=>JSON.stringify(rows.map(({path,id,updated_at,size})=>({path,id,updated_at,size})));
const check=result=>{if(result.error)throw Error('Permintaan Storage gagal. Periksa koneksi dan kredensial di komputer ini.');return result.data;};
export async function inventory(storage){
 const files=[],seen=new Set(),folders=[''];
 while(folders.length){const folder=folders.pop();if(folder.split('/').length>30)throw Error('Struktur folder terlalu dalam.');
  for(let offset=0;;offset+=100){
   const rows=check(await storage.list(folder,{limit:100,offset,sortBy:{column:'name',order:'asc'}}));
   if(!Array.isArray(rows))throw Error('Daftar Storage tidak valid.');
   for(const row of rows){
    if(typeof row.name!=='string'||!row.name||row.name.includes('/')||row.name.includes('\\')||['.','..'].includes(row.name))throw Error('Nama objek tidak valid.');
    const path=folder?folder+'/'+row.name:row.name;if(seen.has(path))throw Error('Objek berulang atau listing berubah. Ulangi saat tidak ada unggahan.');seen.add(path);
    if(row.id==null){folders.push(path);continue;}
    const size=Number(row.metadata?.size);if(!Number.isSafeInteger(size)||size<0||size>MAX_SIZE)throw Error('Ukuran objek tidak valid atau melebihi batas bucket.');
    files.push({path,id:row.id,updated_at:row.updated_at||null,size});
   }
   if(rows.length<100)break;
  }
 }
 return files.sort((a,b)=>a.path.localeCompare(b.path));
}
export async function exportMedia(client,directory){
 const bucket=check(await client.storage.getBucket(BUCKET));if(bucket.public!==false)throw Error('Bucket harus tetap privat.');
 const storage=client.storage.from(BUCKET),before=await inventory(storage),root=resolve(directory);
 await mkdir(root,{mode:0o700});await mkdir(join(root,'objects'),{mode:0o700});
 const entries=[];
 for(const item of before){
  const blob=check(await storage.download(item.path));if(blob.size!==item.size||blob.size>MAX_SIZE)throw Error('Ukuran foto berubah saat backup.');
  const bytes=Buffer.from(await blob.arrayBuffer()),file=hash(Buffer.from(item.path))+'.bin';
  await writeFile(join(root,'objects',file),bytes,{flag:'wx',mode:0o600});
  entries.push({...item,file,sha256:hash(bytes),content_type:blob.type||'application/octet-stream'});
 }
 if(signature(before)!==signature(await inventory(storage)))throw Error('Isi bucket berubah saat backup; hasil belum dinyatakan lengkap.');
 const manifest={version:1,project_ref:PROJECT,bucket:BUCKET,created_at:new Date().toISOString(),complete:true,entries};
 await writeFile(join(root,'manifest.json'),JSON.stringify(manifest,null,2),{flag:'wx',mode:0o600});
 return {objects:entries.length,bytes:entries.reduce((n,x)=>n+x.size,0)};
}
export async function verifyMedia(directory){
 const root=resolve(directory),manifest=JSON.parse(await readFile(join(root,'manifest.json'),'utf8'));
 if(manifest.version!==1||manifest.project_ref!==PROJECT||manifest.bucket!==BUCKET||manifest.complete!==true||!Array.isArray(manifest.entries))throw Error('Manifest backup tidak valid.');
 const objectDir=await lstat(join(root,'objects'));if(!objectDir.isDirectory()||objectDir.isSymbolicLink())throw Error('Direktori objek tidak valid.');
 const paths=new Set();
 for(const entry of manifest.entries){
  if(typeof entry.path!=='string'||paths.has(entry.path)||entry.file!==hash(Buffer.from(entry.path))+'.bin'||!/^[a-f0-9]{64}$/.test(entry.sha256))throw Error('Entri manifest tidak valid.');paths.add(entry.path);
  const file=join(root,'objects',entry.file),stat=await lstat(file);if(!stat.isFile()||stat.isSymbolicLink())throw Error('Objek lokal bukan berkas biasa.');
  const bytes=await readFile(file);if(bytes.length!==entry.size||hash(bytes)!==entry.sha256)throw Error('Checksum foto tidak cocok.');
 }
 return {objects:manifest.entries.length};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{
  if(process.argv[2]==='verify'){console.log(JSON.stringify(await verifyMedia(process.argv[3])));}
  else if(process.argv[2]==='export'){
   // Read server key through stdin from a local hidden prompt; never argv or a URL.
   let input='';for await(const chunk of process.stdin){input+=chunk;if(input.length>16384)throw Error('Input kredensial terlalu panjang.');}
   const {key}=JSON.parse(input);if(typeof key!=='string'||(!key.startsWith('sb_secret_')&&(()=>{try{return JSON.parse(Buffer.from(key.split('.')[1],'base64url')).role!=='service_role';}catch{return true;}})()))throw Error('Gunakan server secret/service_role di komputer tepercaya, bukan publishable key.');
   const {createClient}=await import('@supabase/supabase-js');
   const client=createClient('https://'+PROJECT+'.supabase.co',key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
   console.log(JSON.stringify(await exportMedia(client,process.argv[3])));
  }else throw Error('Pakai: node backend/backup/media.mjs export|verify DIREKTORI');
 }catch{console.error('Backup/verifikasi media gagal. Tidak ada backup lengkap yang dinyatakan berhasil. Kredensial dan detail pelanggan tidak ditampilkan.');process.exitCode=1;}
}
