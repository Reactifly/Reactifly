import { createDomElement, commit } from '../dom/index';
import { createElement } from '../vdom/index';
import { patch } from '../vdom/patch';
import { jsx } from '../index';
import { Fragment } from '../compat/index';
import _ from '../utils/index';

class Root
{
    constructor(htmlRootEl, options)
    {        
        this.htmlRootEl = htmlRootEl;

        this.options = options;
    }

    componentFactory(str)
    {
        const FunctionalComp = function(props)
        {
            let vars = 
            {
                Fragment : Fragment
            };

            return jsx('<Fragment>' + str + '</Fragment>', vars);
        };

        return FunctionalComp;
    }

    render(componentOrJSX)
    {
        componentOrJSX = _.is_string(componentOrJSX) ? this.componentFactory(componentOrJSX) : componentOrJSX;

        let vnode = this.htmlRootEl._reactiflyRoot;
        
        if (vnode)
        {
            let actions = 
            {
                current : []
            };

            patch(vnode, createElement(componentOrJSX), actions.current);

            //console.log(actions.current);

            if (!_.is_empty(actions.current))
            {
                commit(actions.current);
            }

            return;
        }
        else
        {
            vnode = createElement(componentOrJSX);

            let DOMElement = createDomElement(vnode, this.htmlRootEl);

            this.mount(DOMElement, this.htmlRootEl);

            this.htmlRootEl._reactiflyRoot = vnode;

            //console.log(vnode);
        }
    }

    mount(DOMElement, parent)
    {        
        // Edge case where root renders a fragment
        if (_.is_array(DOMElement))
        {
            _.foreach(DOMElement, function(i, childDomElement)
            {
                if (_.is_array(childDomElement))
                {
                    mount(childDomElement, parent);
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

export function createRoot(htmlRootEl, options)
{
    return new Root(htmlRootEl, options);
}

export function render(component, parent)
{       
    let root = createRoot(parent);

    root.render(component);
}
