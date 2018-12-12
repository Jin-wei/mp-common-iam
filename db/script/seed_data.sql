insert into tenant (tenant,description) values ('0000000000','admin tenant a place holder for tenantadmin to manage other tenant');
insert into user_info(id,tenant,username,password,type) values(1,'0000000000','tenantadmin','E006D8203CD837DFF68D35AC5CD63863','internal');
insert into permission(id,tenant,name,description) values(1,'0000000000','createTenants','create a new tenant');
insert into permission(id,tenant,name,description) values(2,'0000000000','deleteTenants','delete a tenant');
insert into permission(id,tenant,name,description) values(3,'0000000000','updateTenants','update a tenant');
insert into role(id,tenant,name,description) values(1,'0000000000','tenantadmin','administrator of tenant');
insert into role_permission(tenant,role_id,permission_id) values('0000000000',1,1);
insert into role_permission(tenant,role_id,permission_id) values('0000000000',1,2);
insert into role_permission(tenant,role_id,permission_id) values('0000000000',1,3);
insert into user_role(tenant,role_id,user_id) values('0000000000',1,1);