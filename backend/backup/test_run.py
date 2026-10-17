import importlib.util,pathlib,tempfile,unittest,subprocess
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('backup_run',pathlib.Path(__file__).with_name('run.py'));module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class BackupTests(unittest.TestCase):
    def test_missing_application_tables_fail_coverage(self):
        with tempfile.TemporaryDirectory() as temporary:
            root=pathlib.Path(temporary)
            (root/'schema.sql').write_text('CREATE TABLE public.properties();')
            (root/'data.sql').write_text('COPY public.properties FROM stdin;')
            with self.assertRaises(RuntimeError):module.coverage(root)
    def test_coverage_distinguishes_managed_auth_data(self):
        with tempfile.TemporaryDirectory() as temporary:
            root=pathlib.Path(temporary)
            names=['public.'+x for x in module.APP_TABLES]+['aup_private.inquiry_limits','aup_private.inquiry_requests']
            text='\n'.join('COPY '+x+' FROM stdin;' for x in names)
            (root/'schema.sql').write_text(text);(root/'data.sql').write_text(text)
            self.assertFalse(module.coverage(root)['auth_users_in_data'])
            (root/'data.sql').write_text(text+'\nCOPY "auth"."users" FROM stdin;\nCOPY auth.mfa_factors FROM stdin;')
            self.assertTrue(module.coverage(root)['auth_users_in_data']);self.assertTrue(module.coverage(root)['auth_mfa_in_data'])
    def test_program_errors_never_echo_credentialed_stderr(self):
        with patch.object(module.subprocess,'run',return_value=subprocess.CompletedProcess([],1,b'',b'password=SECRET')):
            with self.assertRaisesRegex(RuntimeError,'supabase') as caught:module.run(['supabase','db','dump'])
            self.assertNotIn('SECRET',str(caught.exception))
if __name__=='__main__':unittest.main()
