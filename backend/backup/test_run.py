import importlib.util,pathlib,tempfile,unittest,subprocess
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('backup_run',pathlib.Path(__file__).with_name('run.py'));module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

def write_dumps(root,missing_schema=(),missing_data=()):
    names=['public.'+x for x in module.APP_TABLES]+['aup_private.'+x for x in module.PRIVATE_TABLES]
    (root/'schema.sql').write_text('\n'.join('CREATE TABLE '+x+' (id uuid);' for x in names if x not in missing_schema))
    (root/'data.sql').write_text('\n'.join('COPY '+x+' (id) FROM stdin;\n\\.' for x in names if x not in missing_data))

class BackupTests(unittest.TestCase):
    def test_missing_application_tables_fail_coverage(self):
        with tempfile.TemporaryDirectory() as temporary:
            root=pathlib.Path(temporary)
            (root/'schema.sql').write_text('CREATE TABLE public.properties (id uuid);')
            (root/'data.sql').write_text('COPY public.properties FROM stdin;')
            with self.assertRaises(RuntimeError):module.coverage(root)

    def test_coverage_distinguishes_managed_auth_data(self):
        with tempfile.TemporaryDirectory() as temporary:
            root=pathlib.Path(temporary);write_dumps(root)
            checks=module.coverage(root)
            self.assertEqual(len(checks['application_tables']),15)
            self.assertFalse(checks['auth_users_in_data'])
            self.assertFalse(checks['auth_mfa_in_data'])
            with (root/'data.sql').open('a') as data:
                data.write('\nCOPY "auth"."users" (id) FROM stdin;\n\\.\nINSERT INTO "auth"."mfa_factors" (id) VALUES (NULL);')
            checks=module.coverage(root)
            self.assertTrue(checks['auth_users_in_data'])
            self.assertTrue(checks['auth_mfa_in_data'])

    def test_employee_requests_are_required_in_both_schema_and_data(self):
        with tempfile.TemporaryDirectory() as temporary:
            root=pathlib.Path(temporary)
            for missing_schema,missing_data in [(['aup_private.staff_account_requests'],[]),([],['aup_private.staff_account_requests'])]:
                with self.subTest(schema_missing=bool(missing_schema)):
                    write_dumps(root,missing_schema,missing_data)
                    with self.assertRaises(RuntimeError):module.coverage(root)
            write_dumps(root)
            self.assertIn('aup_private.staff_account_requests',module.coverage(root)['application_tables'])

    def test_comments_and_table_mentions_do_not_count_as_exported_rows(self):
        with tempfile.TemporaryDirectory() as temporary:
            root=pathlib.Path(temporary);write_dumps(root,missing_data=['aup_private.staff_account_requests'])
            with (root/'data.sql').open('a') as data:
                data.write('\n-- COPY aup_private.staff_account_requests FROM stdin;\n-- Previously exported aup_private.staff_account_requests')
            with self.assertRaises(RuntimeError):module.coverage(root)
            write_dumps(root)
            with (root/'data.sql').open('a') as data:
                data.write('\n-- COPY auth.users FROM stdin;\n-- INSERT INTO auth.mfa_factors (id) VALUES (NULL);')
            checks=module.coverage(root)
            self.assertFalse(checks['auth_users_in_data'])
            self.assertFalse(checks['auth_mfa_in_data'])

    def test_program_errors_never_echo_credentialed_stderr(self):
        with patch.object(module.subprocess,'run',return_value=subprocess.CompletedProcess([],1,b'',b'password=SECRET')):
            with self.assertRaisesRegex(RuntimeError,'supabase') as caught:module.run(['supabase','db','dump'])
            self.assertNotIn('SECRET',str(caught.exception))

if __name__=='__main__':unittest.main()

