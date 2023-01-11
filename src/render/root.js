import { createDomElement } from '../dom/create';
import { createElement } from '../vdom/element';
import { diff } from '../diff/index';
import { jsx } from '../jsx/index';
import { GLOBAL_CONTEXT } from '../internal';
import _ from '../utils/index';

/**
 * Root class.
 *  
 * @property {HTMLElement}         htmlRootEl  Root html element
 * @property {function}            component   Root component
 * @property {object | undefined}  options     Root options
 */
export class Root
{
    /**
     * Constructor.
     *  
     * @param {HTMLElement}         htmlRootEl  Root html element
     * @param {object | undefined}  options     Options (optional)
     */
    constructor(htmlRootEl, options)
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
    render(componentOrJSX, rootProps)
    {
        this.component = !_.is_callable(componentOrJSX) ? this.__renderFactory(componentOrJSX, rootProps) : componentOrJSX;

        this.htmlRootEl._reactiflyRootVnode ? this.__patchRoot() : this.__renderRoot(rootProps)
    }

    /**
     * Creates wrapper function when passed as JSX string.
     *  
     * @param {string}              jsxStr      Root JSX to render
     * @param {object | undefined}  rootProps   Root props and or decencies for JSX (optional)
     */
    __renderFactory(jsxStr, rootProps)
    {
        const renderFunc = function()
        {
            return jsx(jsxStr, rootProps);
        };

        return renderFunc;
    }

    /**
     * Patches the root Vnode/component when re-rending root or state change.
     *
     */
    __patchRoot()
    {
        diff(this.htmlRootEl._reactiflyRootVnode, createElement(this.component));
    }

    /**
     * Render the root component.
     *
     */
    __renderRoot(rootProps)
    {
        let vnode = createElement(this.component, rootProps);

        let DOMElement = createDomElement(vnode, this.htmlRootEl);

        this.__mount(DOMElement);

        this.htmlRootEl._reactiflyRootVnode = vnode;

        GLOBAL_CONTEXT.current = null;

        console.log(vnode);
    }

    /**
     * Mount root element
     * 
     * @param {HTMLElement | array } DOMElement  HTMLElement(s) returned from root component
     *
     */
    __mount(DOMElement)
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
}