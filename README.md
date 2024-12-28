# arch

arch is a web app for a simple text/image -> 3d model gen ai interface.

![image](https://github.com/user-attachments/assets/c674a696-36a4-4164-9c7a-390023b57afe)

## setup

clone with submodules and make sure trellis works.

to use "send to blender", install the blender addon in `backend/arch_blender.zip`.

to use "send to unreal":
* enable the "remote control api" plugin in your unreal project 
* go to 'project settings' -> 'plugins' -> 'remote control'
* enable 'auto start server web server'
* enable 'restrict server access', 'enable remote python execution', and 'allow console command remote execution'

## usage

start frontend and backend with `npm dev`.
