# projects_Microservice

#### GET /projects: 
Get a list of all projects (not the details of each project)

#### POST /projects:
Create a new project

#### GET /projects/{name}: 
Get a single project (along with the details) by its name

#### PUT /projects/{name}:
Update a single project via its name

#### DELETE /projects/{name}:
Delete a single project via its name

#### GET /projects/members/{uni}:
Get the project (along with the details) containing the specified uni

#### PUT /projects/members/{uni}:
Update the project containing the specified uni

#### DELETE /projects/members/{uni}:
Delete the project containing the specified uni

#### GET /projects/link/{link}:
Get the project (along with its details) containing the specified link

#### PUT /projects/link/{link}:
Update the project containing the specified link

#### DELETE /projects/link/{link}:
Delete the project containing the specified link

#### GET /projects/id/{id}:
Get a single project (along with the details) by its projectID