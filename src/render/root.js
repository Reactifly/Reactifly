import { createDomElement } from '../dom/create';
import { createElement } from '../vdom/element';
import { diff } from '../diff/index';
import { jsx, bind } from '../jsx/index';
import { GLOBAL_CONTEXT, RENDER_CALLBACKS } from '../internal';
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
 * @param {object | undefined}  rootProps   Root props and or decencies for JSX (optional)
 */
Root.prototype.render = function(componentOrJSX, rootProps)
{
    // Re-rendering
    if (arguments.length === 0)
    {
        if (!this.component || !this.htmlRootEl)
        {
            throw new Error('Cannot re-render root. Root has not been rendered first!');
        }

        this.__patchRoot();

        return;
    }

    this.component = !_.is_callable(componentOrJSX) ? this.__renderFactory(componentOrJSX, rootProps) : componentOrJSX;

    this.htmlRootEl._reactiflyRootVnode ? this.__patchRoot() : this.__renderRoot(rootProps);
}

/**
 * Creates wrapper function when passed as JSX string.
 *  
 * @param {string}              jsxStr      Root JSX to render
 * @param {object | undefined}  rootProps   Root props and or decencies for JSX (optional)
 */
Root.prototype.__renderFactory = function(jsxStr, rootProps)
{
    const renderFunc = function()
    {
        bind(rootProps);

        return jsxStr;
    };

    return renderFunc;
}

/**
 * Patches the root Vnode/component when re-rending root or state change.
 *
 */
Root.prototype.__patchRoot = function()
{
    diff(this.htmlRootEl._reactiflyRootVnode, createElement(this.component));

    this.__renderCallbacks();
}

/**
 * Render the root component.
 *
 */
Root.prototype.__renderRoot = function(rootProps)
{
    let vnode = createElement(this.component, rootProps);

    let DOMElement = createDomElement(vnode, this.htmlRootEl);

    this.__mount(DOMElement);

    this.htmlRootEl._reactiflyRootVnode = vnode;

    GLOBAL_CONTEXT.current = null;

    this.__renderCallbacks();
}

/**
 * Executes post render callbacks.
 * 
 */
Root.prototype.__renderCallbacks = function(rootProps)
{
    _.foreach(RENDER_CALLBACKS.current, function(i, callbackSet)
    {
        callbackSet.callback.apply(null, callbackSet.args);
    });

    RENDER_CALLBACKS.current = [];
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