import { createDomElement, commit } from '../dom/index';
import { createElement } from '../vdom/index';
import { patch } from '../vdom/patch';
import { jsx } from '../index';
import _ from '../utils/index';

export class Root
{
    constructor(htmlRootEl, options)
    {        
        this.htmlRootEl = htmlRootEl;

        this.options = options;

        this.component = null;
    }

    render(componentOrJSX, rootProps)
    {
        this.component = !_.is_callable(componentOrJSX) ? this.__componentFactory(componentOrJSX, rootProps) : componentOrJSX;

        this.htmlRootEl._reactiflyRootVnode ? this.__patchRoot() : this.__renderRoot()
    }

    __componentFactory(mixed_var, rootProps)
    {
        const FunctionalComp = function()
        {
            return jsx('<Fragment>' + mixed_var + '</Fragment>', rootProps);
        };

        return FunctionalComp;
    }

    __patchRoot()
    {
        let actions =  { current : [] };

        patch(this.htmlRootEl._reactiflyRootVnode, createElement(this.component), actions.current);

        if (!_.is_empty(actions.current))
        {
            commit(actions.current);
        }
    }

    __renderRoot()
    {
        let vnode = createElement(this.component);

        let DOMElement = createDomElement(vnode, this.htmlRootEl);

        this.__mount(DOMElement, this.htmlRootEl);

        this.htmlRootEl._reactiflyRootVnode = vnode;
    }

    __mount(DOMElement, parent)
    {        
        let _this = this;

        // Edge case where root renders a fragment
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
