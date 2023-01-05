import _ from '../utils/index';

/**
 * Checks if vnode is a context provider.
 *  
 * @param   {object}  vnode
 * @returns {boolean}
 */
export let isContextProvder = (vnode) =>
{
    return isThunk(vnode) && _.is_class(vnode.fn, 'Provider') && vnode.fn.prototype._isValidCtxProvider;
}  

/**
 * Checks if argument is valid reactifly Vnode 
 *  
 * @param   {object}  vnode
 * @returns {boolean}
 */
export let isValidVnode = (vnode) =>
{
    return vnode != null && vnode.__internals && vnode.__internals._isValidVnode;
}    

/**
 * Checks if Vnode is mounted.
 *  
 * @param   {object}  vnode
 * @returns {boolean}
 */
export let isMounted = (vnode) =>
{
    return _.in_dom(nodeElem(vnode));
}

/**
 * Checks if Vnode is fragment.
 *  
 * @param   {object}  vnode
 * @returns {boolean}
 */
export let isFragment = (vnode) =>
{
    return vnode.type === 'fragment';
}

/**
 * Checks if Vnode is thunk.
 *  
 * @param   {object}  vnode
 * @returns {boolean}
 */
export let isThunk = (vnode) =>
{
    return vnode.type === 'thunk';
}

/**
 * Is functional thunk.
 *  
 * @param   {object}  vnode
 * @returns {boolean}
 */
export let isFunctionalThunk = (vnode) =>
{
    return vnode.type === 'thunk' && vnode.__internals.fn !== null
}

/**
 * Is native Vnode.
 *  
 * @param   {object}  vnode
 * @returns {boolean}
 */
export let isNative = (vnode) =>
{
    return vnode.type === 'native';
}

/**
 * Is text Vnode.
 *  
 * @param   {object}  vnode
 * @returns {boolean}
 */
export let isText = (vnode) =>
{
    return vnode.type === 'text';
}

/**
 * Is empty Vnode.
 *  
 * @param   {object}  vnode
 * @returns {boolean}
 */
export let isEmpty = (vnode) =>
{
    return vnode.type === 'empty';
}

/**
 * Has no children.
 *  
 * @param   {object}  vnode
 * @returns {boolean}
 */
export let noChildren = (vnode) =>
{
    return vnode.children.length === 1 && isEmpty(vnode.children[0]);
}

/**
 * Has single child.
 *  
 * @param   {object}  vnode
 * @returns {boolean}
 */
export let singleChild = (vnode) =>
{
    return vnode.children.length === 1 && !isEmpty(vnode.children[0]);
}

/**
 * Are thunks the same.
 *  
 * @param   {object}  left
 * @param   {object}  right
 * @returns {boolean}
 */
export let isSameThunk = (left, right) =>
{
    // Functional component
    if (isFunctionalThunk(left) || isFunctionalThunk(right))
    {
        return left.__internals._name === right.__internals._name && left.__internals._fn === right.__internals._fn;
    }

    return left.fn === right.fn && left.__internals._name === right.__internals._name;
}

/**
 * Are fragments the same.
 *  
 * @param   {object}  left
 * @param   {object}  right
 * @returns {boolean}
 */
export let isSameFragment = (left, right) =>
{
    return isFragment(left) && isFragment(right) && left.fn === right.fn;
}

/**
 * Is thunk instantiated.
 *  
 * @param   {object}  vnode
 * @returns {boolean}
 */
export let isThunkInstantiated = (vnode) =>
{
    return nodeComponent(vnode) !== null;
}

/**
 * Checks if a thunk Vnode is only nesting a fragment.
 *  
 * @param   {object}  vnode
 * @returns {boolean}
 */
export let isNestingFragment = (vnode) =>
{
    if (isThunk(vnode) && isThunkInstantiated(vnode))
    {
        while (vnode.children && isThunk(vnode))
        {
            vnode = vnode.children[0];
        }

        return isFragment(vnode);
    }

    return false;
}

/**
 * Thunk function name.
 *  
 * @param   {object}  vnode
 * @returns {string}
 */
export let thunkName = (vnode) =>
{
    return vnode.__internals._name;
}

/**
 * Set/get node element.
 *  
 * @param   {object}                   vnode
 * @param   {HTMLElement | undefined}  Elem 
 * @returns {HTMLElement}
 */
export let nodeElem = (vnode, elem) =>
{
    if (!_.is_undefined(elem))
    {
        vnode.__internals._domEl = elem;

        return elem;
    }

    if (isThunk(vnode) || isFragment(vnode))
    {
        return findThunkDomEl(vnode);
    }

    return vnode.__internals._domEl;
}

/**
 * Set/get native Vnodes attributes.
 *  
 * @param   {object}              vnode
 * @param   {object | undefined}  attrs 
 * @returns {object}
 */
export let nodeAttributes = (vnode, attrs) =>
{
    if (!_.is_undefined(attrs))
    {
        vnode.__internals._prevAttrs = vnode.attributes;

        vnode.attributes = attrs;
    }

    return vnode.attributes;
}

/**
 * Set/get Vnode's component.
 *  
 * @param   {object}              vnode
 * @param   {object | undefined}  component 
 * @returns {object}
 */
export let nodeComponent = (vnode, component) =>
{
    if (!_.is_undefined(component))
    {
        vnode.__internals._component = component;
    }

    return vnode.__internals._component;
}

/**
 * Set/get component's Vnode.
 *  
 * @param   {object}              component
 * @param   {object | undefined}  vnode 
 * @returns {object}
 */
export let componentNode = (component, vnode) =>
{
    if (!_.is_undefined(vnode))
    {
        component.__internals._vnode = vnode;
    }

    return component.__internals._vnode;
}


/**
 * Returns the parent DOMElement of a given vnNode.
 *  
 * @param   {object}  vnode
 * @returns {HTMLElement}
 */
export let parentElem = (vnode) =>
{
    // Native vnode
    if (isNative(vnode) || isText(vnode) || isEmpty(vnode))
    {
        return nodeElem(vnode).parentNode;
    }

    // Thunks / fragments with a direct child
    let child = vnode.children[0];

    if (isNative(child) || isText(child) || isEmpty(child))
    {
        return nodeElem(child).parentNode;
    }

    // Recursively traverse down tree until either a DOM vnode is found
    // or a fragment is found and return it's parent

    while (isThunk(child) || isFragment(child))
    {
        vnode = child;
        child = child.children[0];
    }

    return isFragment(vnode) ? nodeElem(vnode.children[0]).parentNode : nodeElem(child).parentNode;
}

/**
 * Returns index of Vnode relative to parent / siblings.
 *  
 * @param   {object}  vnode
 * @returns {number}
 */
export let domIndex = (vnode) =>
{
    let parentDOMElement = parentElem(vnode);

    let domSiblings = Array.prototype.slice.call(parentDOMElement.children);

    let thisEl = nodeElem(vnode);

    thisEl = _.isArray(thisEl) ? thisEl[0] : thisEl;

    let index = 0;

    _.foreach(domSiblings, function(i, siblingEl)
    {
        if (siblingEl === thisEl)
        {
            index = i;

            return false;
        }
    });

    return index;
}

/**
 * Recursively traverse down tree until either a DOM node is found
 * or a fragment is found and return it's children
 *  
 * @param   {object}  vnode
 * @returns {array|HTMLElement}
 */
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
        }) :
        nodeElem(child);
}

/**
 * Points vnode -> component and component -> vndode
 *  
 * @param  {object}  vnode
 * @param  {object}  component
 */
export let pointVnodeThunk = (vnode, component) =>
{
    // point vnode -> component
    vnode.__internals._component = component;

    // point component -> vnode
    component.__internals._vnode = vnode;
}

/**
 * Patches right Vnode to left.
 *  
 * @param  {object}  left
 * @param  {object}  right
 */
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