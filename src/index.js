import { render }  from './render/index';
import { Component, Fragment, useState } from './compat/index';
import { jsx } from './jsx/index';
import { createElement, createElement as h } from './vdom/index';
export { render, Component, Fragment, useState, jsx, createElement, h };
const Reactify = 
{
	render,
	Component, Fragment, useState,
	jsx,
	createElement,
	h
};

let win = window || global;

win.Reactify = Reactify;

export default Reactify;
