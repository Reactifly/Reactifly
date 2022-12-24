import { createRoot, render }  from './render/index';
import { Component, Fragment, useState } from './compat/index';
import { jsx, register } from './jsx/index';
import { createElement, createElement as h } from './vdom/index';

export { createRoot, render, Component, Fragment, useState, jsx, register, createElement, h };

const Reactifly = 
{
	createRoot,
	render,
	register,
	Component, Fragment, useState,
	jsx,
	createElement,
	h
};

let win = window || global;

win.Reactifly = Reactifly;

export default Reactifly;
