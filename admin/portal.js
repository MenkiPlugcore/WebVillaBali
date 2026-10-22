export function portalConfig(pathname='/admin/'){
 const developer=/^\/dev(?:\/|$)/.test(pathname);
 return {developer,home:developer?'/dev/':'/admin/',storageKey:developer?'aup-dev-session':'aup-admin-session',label:developer?'DEVELOPER':'ADMIN',logoutScope:developer?'local':'global'};
}
export function portalRoleAllowed(role,developer){return developer?role==='developer':['owner','admin','editor'].includes(role);}
export function canManagePanel(role){return ['owner','developer'].includes(role);}
