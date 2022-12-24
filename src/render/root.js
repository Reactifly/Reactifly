import { createDomElement, commit } from '../dom/index';
import { createElement } from '../vdom/index';
import { patch } from '../vdom/patch';
import { jsx } from '../jsx/index';
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
        this.component = !_.is_callable(componentOrJSX) ? this.__componentFactory(componentOrJSX, rootProps) : componentOrJSX;

        this.htmlRootEl._reactiflyRootVnode ? this.__patchRoot() : this.__renderRoot()
    }

    /**
     * Creates wrapper function when passed as JSX string.
     *  
     * @param {string}              jsxStr      Root JSX to render
     * @param {object | undefined}  rootProps   Root props and or decencies for JSX (optional)
     */
    __componentFactory(jsxStr, rootProps)
    {
        const FunctionalComp = function()
        {
            return jsx('<Fragment>' + jsxStr + '</Fragment>', rootProps);
        };

        return FunctionalComp;
    }

    /**
     * Patches the root Vnode/component when re-rending root or state change.
     *
     */
    __patchRoot()
    {
        let actions =  { current : [] };

        patch(this.htmlRootEl._reactiflyRootVnode, createElement(this.component), actions.current);

        if (!_.is_empty(actions.current))
        {
            commit(actions.current);
        }
    }

    /**
     * Render the root component.
     *
     */
    __renderRoot()
    {
        let vnode = createElement(this.component);

        let DOMElement = createDomElement(vnode, this.htmlRootEl);

        this.__mount(DOMElement);

        this.htmlRootEl._reactiflyRootVnode = vnode;
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
