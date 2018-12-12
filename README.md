# common-iam
It is a common identity authentication and authorization service.
it provides A&A service to other functional components/services.
It also supports multi-tenant and can be used by multiple projects at the same time.

# dependency
Install redis and start redis on default port

# dev env set up
1. Install mysql server version 5.6+
2. Install nodejs version 4.3.2
3. Install npm 2.15.10
4. set up db
    * db/script/_create_schema.sql
    * db/script/crete_tables.sql
    * db/script/seed_data.sql
5. update dev settings: conf_dev.json
6. DEV build: ./build_dev.sh
7. start service
    * node main.js -p 8091
8. api doc
    * http://localhost:8091/apidocs/index.html
9. UI
    * http://localhost:8091
10. Create a new tenant through UI or API. And basic authentication and authorization service is up for this tenant.

# staging env
1. api doc
    * http://60.205.227.44:18091/apidocs/index.html
2. UI
    * http://60.205.227.44:18091
3. test tenant
    * cm
    * username/password: cmadmin/cmadmin

# Functions
1. Manage user,
2. Manage permissions
3. Manage user roles
4. Get and refresh user auth token





