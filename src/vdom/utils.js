import _ from '../utils/index';

/**
 * Patch a left vnode with a right one
 */

export function patchVnode(left, right)
{
    for (let key in left)
    {
        delete left[key];
    }

    for (let key in right)
    {
        left[key] = right[key];
    }
}

/**
 * Functional type checking
 */

export let isMounted = (node) =>
{
    return _.in_dom(nodeElem(node));
}

export let isFragment = (node) =>
{
    return node.type === 'fragment';
}

export let isThunk = (node) =>
{
    return node.type === 'thunk';
}

export let isNative = (node) =>
{
    return node.type === 'native';
}

export let isText = (node) =>
{
    return node.type === 'text';
}

export let isEmpty = (node) =>
{
    return node.type === 'empty';
}

export let noChildren = (node) =>
{
    return node.children.length === 1 && isEmpty(node.children[0]);
}

export let singleChild = (node) =>
{
    return node.children.length === 1 && !isEmpty(node.children[0]);
}

export let isSameThunk = (left, right) =>
{
    // Functional component
    if (left.__internals._fn || right.__internals._fn)
    {
        return left.__internals._name === right.__internals._name && left.__internals._fn === right.__internals._fn;
    }

    return left.fn === right.fn && left.__internals._name === right.__internals._name;
}

export let isThunkInstantiated = (vnode) =>
{
    return nodeComponent(vnode) !== null;
}

export let isSameFragment = (left, right) =>
{
    return isFragment(left) && isFragment(right) && left.fn === right.fn;
}

/**
 * Checks if thunk is nesting only a fragment.
 */

export let isNestingFragment = (node) =>
{
    if (isThunk(node) && isThunkInstantiated(node))
    {
        while (node.children && isThunk(node))
        {
            node = node.children[0];
        }

        return isFragment(node);
    }

    return false;
}

/**
 * Returns thunk function / class name
 */

export let thunkName = (node) =>
{
    return node.__internals._name;
}

/**
 * Get/set a nodes DOM element
 */

export let nodeElem = (node, elem) =>
{
    if (!_.is_undefined(elem))
    {
        node.__internals._domEl = elem;

        return elem;
    }

    if (isThunk(node) || isFragment(node))
    {
        return findThunkDomEl(node);
    }

    return node.__internals._domEl;
}

/**
 * Returns the actual parent DOMElement of a parent node.
 * 
 */

export let nodeElemParent = (parent) =>
{
    if (isFragment(parent) || isThunk(parent))
    {
        let child = nodeElem(parent);

        return _.is_array(child) ? child[0].parentNode : child.parentNode;
    }

    return nodeElem(parent);
}

/**
 * Returns the parent DOMElement of a given vnNode
 * 
 */

export let parentElem = (node) =>
{
    // Native node
    if (isNative(node) || isText(node) || isEmpty(node))
    {
        return nodeElem(node).parentNode;
    }
    
    // Thunks / fragments with a direct child
    let child = vnode.children[0];

    if (isNative(child) || isText(child) || isEmpty(child))
    {
        return nodeElem(child).parentNode;
    }

    // Recursively traverse down tree until either a DOM node is found
    // or a fragment is found and return it's parent

    while (isThunk(child) || isFragment(child))
    {
        vnode = child;
        child = child.children[0];
    }

    return isFragment(vnode) ? nodeElem(vnode.children[0]).parentNode : nodeElem(vnode).parentNode;
}

/**
 * Returns the parent DOMElement of a given vnNode
 * 
 */

export let childDomIndex = (parent, index) =>
{
    if (parent.children.length <= 1)
    {
        return 0;
    }

    let buffer = 0;

    _.foreach(parent.children, function(i, child)
    {
        if (i >= index)
        {
            return false;
        }
        else if (isThunk(child))
        {
            let els = nodeElem(child);

            if (_.is_array(els))
            {
                buffer += els.length;
            }
        }
    });

    return buffer + index;
}

/**
 * Get/set a nodes DOM element
 */

export let nodeAttributes = (node, attrs) =>
{
    if (!_.is_undefined(attrs))
    {
        node.__internals._prevAttrs = node.attributes;

        node.attributes = attrs;
    }

    return node.attributes;
}

/**
 * Get/set a nodes component
 */

export let nodeComponent = (node, component) =>
{
    if (!_.is_undefined(component))
    {
        node.__internals._component = component;
    }

    return node.__internals._component;
}

// Recursively traverse down tree until either a DOM node is found
// or a fragment is found and return it's children

function findThunkDomEl(vnode)
{
    if (isNative(vnode) || isText(vnode) || isEmpty(vnode))
    {
        return nodeElem(vnode);
    }

    let child = vnode.children[0];

    while (isThunk(child) || isFragment(child))
    {
        vnode = child;
        child = child.children[0];
    }

    return isFragment(vnode) ? 
        _.map(vnode.children, function(i, child)
        { 
            return nodeElem(child); 
        }) 
        : nodeElem(vnode);
}

// Recursively traverse down tree until either a DOM node is found
// or a fragment is found and return it's children

function findThunkParentDomEl(vnode)
{
    let child = vnode.children[0];

    if (isNative(child) || isText(child) || isEmpty(child))
    {
        return nodeElem(child).parentNode;
    }

    while (isThunk(child) || isFragment(child))
    {
        vnode = child;
        child = child.children[0];
    }

    return isFragment(vnode) ? nodeElem(vnode.children[0]).parentNode : nodeElem(vnode).parentNode;
}

/**
 * Points vnode -> component and component -> vndode
 */

export let pointVnodeThunk = (vnode, component) =>
{
    // point vnode -> component
    vnode.__internals._component = component;

    // point component -> vnode
    component.__internals.vnode = vnode;

    // Point vnode.children -> component.props.children
    if (component.props && component.props.children)
    {
        vnode.children = component.props.children;
    }
}

export function patchVnodes(left, right)
{
    _.foreach(left, function(key, val)
    {
        let rval = right[key];

        if (_.is_undefined(rval))
        {
            delete left[key];
        }
        else
        {
            left[key] = rval;
        }
    });
}

/**
 * Recursively calls unmount on nested components
 * in a sub tree
 */

export let nodeWillUnmount = (vnode) =>
{
    if (isThunk(vnode) || isFragment(vnode))
    {
        let component = nodeComponent(vnode);

        if (component && _.is_callable(component.componentWillUnmount))
        {
            component.componentWillUnmount();
        }

        if (!noChildren(vnode))
        {
            _.foreach(vnode.children, function(i, child)
            {
                nodeWillUnmount(child);
            });
        }
    }
    else if (isNative(vnode) && !noChildren(vnode))
    {
        _.foreach(vnode.children, function(i, child)
        {
            nodeWillUnmount(child);
        });
    }
}