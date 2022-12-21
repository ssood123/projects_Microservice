# projects_Microservice

#### GET /projects: 
Get a list of all project names (not the details of each project)

#### POST /projects:
Create a new project by specifying name, description, members, and link in the request body

#### GET /projects/{name}:
Get the description of a project with a given name

#### PUT /projects/{name}:
Update an existing project's name and description

#### DELETE /projects{name}:
Delete a given project by specifying its name

#### GET /projects/{name}/members
Get the members of a project with a given name

#### PUT /projects/{name}/members
Update the members of a project with a given name by passing the members list in the request body

#### DELETE /projects/{name}/members/{uni}
Delete a member (uni) from the list of members of a project with a given name

#### GET /projects/{name}/link
Get the link of a project with a given name

#### PUT /projects/{name}/link
Update the link of a project with a given name by specifying the link in the request body

#### DELETE /projects/{name}/link
Delete the link of a project with a given name

#### GET /projects/{id}/id
Get the details of a project by specifying its projectID

# Example of request body:
{
    "name": "project9",
    "description": "this is project 9",
    "unis": "aafe1234, bbcd1234, cc1234",
    "link": "project9.com"
}