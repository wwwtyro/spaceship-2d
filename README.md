#Proceduro Spaceship 2D

Create 2D spaceship diffuse, normal, depth, and position sprites through directed evolution.

## Web app instructions

Head over to http://wwwtyro.github.io/spaceship-2d. You'll be greeted with this:

![](https://raw.githubusercontent.com/wwwtyro/spaceship-2d/master/docs/ss0.png)

To get started, simply click the spaceship that is most attractive to you.

When you do so, a new set of ships will be generated from the ship you clicked, with their attributes altered a little bit from the original:

![](https://raw.githubusercontent.com/wwwtyro/spaceship-2d/master/docs/ss2.png)

You can adjust the mutation rate for each generation by manipulating the sliders labelled "Base Color Mutation", "Detail Color Mutation", and "Shape Mutation". Play with these a bit to get a feel for how they affect following generations.

Once you've found a ship you like, hover over it with your mouse and click the save icon associated with it. A dialog will pop up, allowing you to adjust the resolution and right-click / save-as the images you want. The images currently provided are diffuse, normal, depth, and position.

![](https://raw.githubusercontent.com/wwwtyro/spaceship-2d/master/docs/ss3.png)

It's a bit tedious to save lots of ships this way, so there's a desktop version of this tool that can manage that for you.

## Desktop app instructions

Proceduro Spaceship 2D can be run as a desktop application, enabling more straightforward file saving operations, and allowing you to generate and save large numbers of sprites at once. The desktop application runs under nw.js, so the first step to get it running is to head over to http://nwjs.io/ and download the nw.js package for your platform.

Next, you'll want to make a copy of this repo:

```
$ git clone git@github.com:wwwtyro/spaceship-2d.git
```

Once you've done so, go into the spaceship-2d directory and run nw.js against the app folder:
```
$ cd spaceship-2d
$ ls
app  docs  LICENSE  README.md  spaceship2d  webapp

$ nw app
```

You should be greeted with the desktop version of the application.
