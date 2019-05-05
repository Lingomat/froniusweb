![Built With Stencil](https://img.shields.io/badge/-Built%20With%20Stencil-16161d.svg?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjIuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI%2BCjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI%2BCgkuc3Qwe2ZpbGw6I0ZGRkZGRjt9Cjwvc3R5bGU%2BCjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik00MjQuNywzNzMuOWMwLDM3LjYtNTUuMSw2OC42LTkyLjcsNjguNkgxODAuNGMtMzcuOSwwLTkyLjctMzAuNy05Mi43LTY4LjZ2LTMuNmgzMzYuOVYzNzMuOXoiLz4KPHBhdGggY2xhc3M9InN0MCIgZD0iTTQyNC43LDI5Mi4xSDE4MC40Yy0zNy42LDAtOTIuNy0zMS05Mi43LTY4LjZ2LTMuNkgzMzJjMzcuNiwwLDkyLjcsMzEsOTIuNyw2OC42VjI5Mi4xeiIvPgo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNNDI0LjcsMTQxLjdIODcuN3YtMy42YzAtMzcuNiw1NC44LTY4LjYsOTIuNy02OC42SDMzMmMzNy45LDAsOTIuNywzMC43LDkyLjcsNjguNlYxNDEuN3oiLz4KPC9zdmc%2BCg%3D%3D&colorA=16161d&style=flat-square)

# Fronweb 

This is a web component that displays real-time and archive data from a Fronius inverter. It connects directly to the Fronius inverter API locally rather than via solar web. It is intended to run on a small screen such as a Raspberry Pi gadget. It assumes there is a smart meter installed. It's also not going to work right if your smart meter is on demand rather than supply. Shrug, I'm sure you can figure it out.

![Froniusweb screenshot](/screenshot.png)

Fronius REST API is seriously hot garbage. The best I can say is at least there is an API and it generally works. Requests take many seconds to complete with the exception of /solar_api/v1/GetPowerFlowRealtimeData.fcgi, which only takes tens of milliseconds. It seems this fast cgi was some afterthought second process?

Seriously, how hard would it be to realise that all we want is a small set of power data, both instaneous and day accumulated, but no, each API gives you mountains of shit you don't want, most of which you have to guess because they're not explained in the docs, and you're forced to make multiple slow API calls just to get five or six items of data. What's wrong with these guys?

This code makes sparing use of slower API commands, particularly so for the historical data for the graphs which is done on start up and every 15 minutes. 

Note that REST requests need CORS enabled end-points to work from web clients. The Fronius inverter doesn't do this naturally, not even whitelisting the local LAN, so it will need to be used in conjunction with a CORS proxy as as https://github.com/Rob--W/cors-anywhere.

You must pass the API URL to the component via the apiurl property. With CORS anywhere proxy, this might look something like this where the first IP/port is the CORS proxy and the second is the address of the inverter on the local network.

```
<fronweb-component apiurl="http://192.168.1.250:8157/http://192.168.1.240"></fronweb-component>
```

## Methods

pause() --- will pause the updates, and stop data fetching
resume() --- resumes data updates

## Using this component

### Script tag

- Put a script tag similar to this `<script src='https://unpkg.com/froniuswebcomponent/dist/fronweb.js'></script>` in the head of your index.html
- Then you can use the element anywhere in your template, JSX, html etc

### Node Modules
- Run `npm install froniuswebcomponent --save`
- Put a script tag similar to this `<script src='node_modules/froniuswebcomponent/dist/fronweb.js'></script>` in the head of your index.html
- Then you can use the element anywhere in your template, JSX, html etc

