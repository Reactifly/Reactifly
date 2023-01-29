import { createDomElement } from '../dom/create';
import { createElement } from '../vdom/element';
import { Component } from '../compat/Component';
import { diff } from '../diff/index';
import { bind } from '../jsx/index';
import { GLOBAL_CONTEXT, CURR_RENDER } from '../internal';
import { didMount } from '../vdom/lifecycle';
import _ from '../utils/index';

/**
 * Root.
 *  
 * @property {HTMLElement}         htmlRootEl  Root html element
 * @property {object | undefined}  options     Root options
 */
export function Root(htmlRootEl, options)
{
    this.htmlRootEl = htmlRootEl;

    this.options = options;

    this.component = null;
}

/**
 * Render root component.
 *  
 * @param function | string}   component   Component to render
 * @param {object | undefined}  bindings   Root props and or decencies for JSX (optional)
 */
Root.prototype.render = function(componentOrJSX, bindings)
{
    // root.render()
    if (arguments.length === 0)
    {
        if (!this.component || !this.htmlRootEl)
        {
            throw new Error('Cannot re-render root. Root needs to be rendered first!');
        }

        this.__patchRoot();

        return;
    }

    this.component = !_.is_callable(componentOrJSX) ? this.__renderFactory(componentOrJSX, bindings) : componentOrJSX;

    this.htmlRootEl._reactiflyRootVnode ? this.__patchRoot() : this.__renderRoot(bindings);
}

/**
 * Creates wrapper function when passed as JSX string.
 *  
 * @param {string}              jsxStr      Root JSX to render
 * @param {object | undefined}  bindings   Root props and or decencies for JSX (optional)
 */
Root.prototype.__renderFactory = function(jsxStr, bindings)
{
    class __ReactiflyRoot extends Component
    {
        constructor(props)
        {
            super(props);
        }

        render()
        {            
            if (bindings) bind(bindings);

            return jsxStr;
        }
    }

    return __ReactiflyRoot;
}

/**
 * Patches the root Vnode/component when re-rending root or state change.
 *
 */
Root.prototype.__patchRoot = function()
{
    diff(this.htmlRootEl._reactiflyRootVnode, createElement(this.component));
}

/**
 * Render the root component.
 *
 */
Root.prototype.__renderRoot = function(bindings)
{
    if (bindings) bind(bindings);

    let vnode = createElement(this.component);

    let DOMElement = createDomElement(vnode, this.htmlRootEl);

    this.__mount(DOMElement);

    didMount(this.component, true);

    this.htmlRootEl._reactiflyRootVnode = vnode;

    GLOBAL_CONTEXT.current = null;

    CURR_RENDER.current = null;
}

/**
 * Mount root element
 * 
 * @param {HTMLElement | array } DOMElement  HTMLElement(s) returned from root component
 *
 */
Root.prototype.__mount = function(DOMElement)
{
    let _this = this;

    let parent = this.htmlRootEl;

    // Where root renders a fragment or returns a thunk that renders a fragment
    if (_.is_array(DOMElement))
    {
        _.foreach(DOMElement, function(i, childDomElement)
        {
            if (_.is_array(childDomElement))
            {
                _this.__mount(childDomElement, parent);
            }
            else
            {
                parent.appendChild(childDomElement);
            }
        });

        return;
    }

    if (_.is_htmlElement(DOMElement))
    {
        parent.appendChild(DOMElement);
    }
}