import _ from '../utils/index';
import * as vDOM from '../vdom/index';
import { createDomElement } from './create';
import { setDomAttribute, removeDomAttribute } from './attributes';
import * as events from './events';

/**
 * Commit tree patching to DOM / vDom
 * 
 * @param {array}  actions  Array of actions.
 * 
 */
export function commit(actions)
{
    console.log(actions);

    _.foreach(actions, function(i, action)
    {
        let {callback, args } = action;
        
        callback.apply(null, args);
    });
}

/**
 * Replace Vnode / DomNode text
 * 
 * @param {object}  vndone  Vnode to replace text
 * @param {string}  text    Text to set
 */
export function replaceText(vnode, text)
{
    vnode.nodeValue = text;

    vDOM.nodeElem(vnode).nodeValue = text;
}

/**
 * Replace Vnode / DomNode
 * 
 * @param {object}  vndone  Left Vnode to replace text
 * @param {object}  vndone  Right Vnode to replace with
 */
export function replaceNode(left, right)
{
    vDOM.nodeWillUnmount(left);

    removeEvents(left);

    let rDOMElement      = createDomElement(right);
    let lDOMElement      = vDOM.nodeElem(left);
    let parentDOMElement = vDOM.parentElem(left);

    // We don't care if left or right is a thunk or fragment here
    // all we care about are the nodes returned from createDomElement()

    // left fragment nodes
    if (_.is_array(lDOMElement))
    {
        // right multiple nodes also
        if (_.is_array(rDOMElement))
        {
            _.foreach(lDOMElement, function(i, lChild)
            {
                let rChild = rDOMElement[i];

                if (rChild)
                {
                    parentDOMElement.replaceChild(rChild, lChild);
                }
                else
                {
                    parentDOMElement.removeChild(lChild);
                }
            });
        }
        else
        {
            parentDOMElement.replaceChild(rDOMElement, lDOMElement.shift());

            if (!_.is_empty(lDOMElement))
            {
                _.foreach(lDOMElement, function(i, lChild)
                {
                    parentDOMElement.removeChild(lChild);
                });
            }
        }
    }
    // left single node
    else
    {
        // right multiple nodes
        if (_.is_array(rDOMElement))
        {
            let targetSibling = lDOMElement.nextSibling;

            // Replace first node
            parentDOMElement.replaceChild(rDOMElement.shift(), lDOMElement);

            // Insert the rest at index
            if (!_.is_empty(rDOMElement))
            {
                _.foreach(rDOMElement, function(i, rChild)
                {
                    if (targetSibling)
                    {
                        parentDOMElement.insertBefore(rChild, targetSibling);
                    }
                    else
                    {
                        parentDOMElement.appendChild(rChild);
                    }
                });
            }
        }
        else
        {
            parentDOMElement.replaceChild(rDOMElement, lDOMElement);
        }
    }

    vDOM.patchVnodes(left, right);
}

/**
 * Append Vnode / DomNode
 * 
 * @param {object}  parentVnode  Parent Vnode to append to
 * @param {object}  vndone       Vnode to append
 */
export function appendChild(parentVnode, vnode)
{
    let parentDOMElement = vDOM.nodeElemParent(parentVnode);
    let DOMElement = createDomElement(vnode);

    if (_.is_array(DOMElement))
    {
        _.foreach(DOMElement, function(i, child)
        {                
            parentDOMElement.appendChild(child);
        });
    }
    else
    {
        parentDOMElement.appendChild(DOMElement);
    }

    parentVnode.children.push(vnode);
}

/**
 * Remove child Vnode / DomNode
 * 
 * @param {object}  parentVnode  Parent Vnode to append to
 * @param {object}  vndone       Vnode to append
 */
export function removeChild(parentVnode, vnode)
{
    vDOM.nodeWillUnmount(vnode);

    removeEvents(vnode);

    let parentDOMElement = vDOM.parentElem(vnode);

    let DOMElement = vDOM.nodeElem(vnode);

    if (_.is_array(DOMElement))
    {
        _.foreach(DOMElement, function(i, child)
        {
            parentDOMElement.removeChild(child);
        });
    }
    else
    {
        parentDOMElement.removeChild(DOMElement);
    }

    parentVnode.children.splice(parentVnode.children.indexOf(vnode), 1);
}

function removeEvents(vnode)
{
    if (vDOM.isThunk(vnode) || vDOM.isFragment(vnode))
    {
        if (!vDOM.noChildren(vnode))
        {
            _.foreach(vnode.children, function(i, child)
            {
                removeEvents(child);
            });
        }
    }
    else if (vDOM.isNative(vnode))
    {
        let DOMElement = vDOM.nodeElem(vnode);

        if (DOMElement)
        {
            events.removeEventListener(DOMElement);
        }

        if (!vDOM.noChildren(vnode))
        {
            _.foreach(vnode.children, function(i, child)
            {
                removeEvents(child);
            });
        }
    }
}

// Problem with moving / inserting to index
// is actual DOM index doesn't line up with the vnode index
// if a vnode is nesting a fragment

export function insertAtIndex(parentVnode, vnode, index)
{
    let vIndex           = index;
    let dIndex           = vDOM.childDomIndex(parentVnode, index);
    let DOMElement       = createDomElement(vnode);
    let parentDOMElement = vDOM.nodeElemParent(parentVnode);

    if (_.is_array(DOMElement))
    {        
        _.foreach(DOMElement, function(i, child)
        {
            if (dIndex >= parentDOMElement.children.length)
            {
                parentDOMElement.appendChild(child);
            }
            else
            {                
                parentDOMElement.insertBefore(child, parentDOMElement.children[dIndex]);
            }

            dIndex++;
        });
    }
    else
    {
        if (dIndex >= parentDOMElement.children.length)
        {
            parentDOMElement.appendChild(DOMElement);
        }
        else
        {
            parentDOMElement.insertBefore(DOMElement, parentDOMElement.children[dIndex]);
        }
    }

    parentVnode.children.splice(vIndex, 0, vnode);
}

export function moveToIndex(parentVnode, vnode, index)
{
    let vIndex           = index;
    let dIndex           = vDOM.childDomIndex(parentVnode, index);
    let DOMElement       = vDOM.nodeElem(vnode);
    let isFragment       = _.is_array(DOMElement);
    let parentDOMElement = vDOM.nodeElemParent(parentVnode);
    let currIndex        = isFragment ? Array.prototype.slice.call(parentDOMElement.children).indexOf(DOMElement[0]) : Array.prototype.slice.call(parentDOMElement.children).indexOf(DOMElement);
    
    if (isFragment)
    {
        moveFragmentDomEls(parentDOMElement, DOMElement, dIndex, currIndex);

        return;
    }

    // Nothing to do
    if (currIndex === dIndex || (dIndex === 0 && parentDOMElement.children.length === 0))
    {
        
    }
    // Move to start
    else if (dIndex === 0)
    {
        parentDOMElement.insertBefore(DOMElement, parentDOMElement.firstChild);
    }
    // Move to end
    else if (dIndex >= parentDOMElement.children.length)
    { 
        parentDOMElement.removeChild(DOMElement);
        parentDOMElement.appendChild(DOMElement);
    }
    else
    {
        parentDOMElement.insertBefore(DOMElement, parentDOMElement.children[dIndex]);
    }

    // Move vnode
    let vChildren  = parentVnode.children;
    let vCurrIndex = vChildren.indexOf(vnode);

    // Do nothing
    if (vCurrIndex === vIndex || (vIndex === 0 && vChildren.length === 0))
    {
        // Nothing to do
    }
    else
    {
        vChildren.splice(vIndex, 0, vChildren.splice(vCurrIndex, 1)[0]);
    }
}

function moveFragmentDomEls(parentDOMElement, DOMElements, index, currIndex)
{    
    // Nothing to do
    if (currIndex === index || (index === 0 && parentDOMElement.children.length === 0))
    {
        return;
    }
    
    // Move to start
    if (index === 0)
    {
        _.foreach(DOMElements, function(i, child)
        {
            parentDOMElement.insertBefore(child, parentDOMElement.firstChild);
        });
    }
    // Move to end
    else if (index >= parentDOMElement.children.length)
    { 
        _.foreach(DOMElements, function(i, child)
        {
            parentDOMElement.removeChild(child);
            parentDOMElement.appendChild(child);
        });
    }
    else
    {
        _.foreach(DOMElements, function(i, child)
        {
            parentDOMElement.insertBefore(child, parentDOMElement.children[index]);

            index++;
        });
    }
}

export function setAttribute(vnode, name, value, previousValue)
{
    setDomAttribute(vDOM.nodeElem(vnode), name, value, previousValue);
}

export function removeAttribute(vnode, name, previousValue)
{
    removeDomAttribute(vDOM.nodeElem(vnode), name, previousValue)
}
