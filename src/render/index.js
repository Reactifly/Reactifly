import { createDomElement } from '../dom/index';
import { createElement, nodeElem } from '../vdom/index';
import _ from '../utils/index';

export function render(component, parent)
{        
    let vnode = createElement(component);

    let DOMElement = createDomElement(vnode, parent);

    mount(DOMElement, parent);

    console.log(vnode);
}

export function mount(DOMElement, parent)
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