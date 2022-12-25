import _ from '../utils/index';

/**
 * Checks if Vnode is mounted.
 *  
 * @param   {object}  node
 * @returns {boolean}
 */
export let isMounted = (node) =>
{
    return _.in_dom(nodeElem(node));
}

/**
 * Checks if Vnode is fragment.
 *  
 * @param   {object}  node
 * @returns {boolean}
 */
export let isFragment = (node) =>
{
    return node.type === 'fragment';
}

/**
 * Checks if Vnode is thunk.
 *  
 * @param   {object}  node
 * @returns {boolean}
 */
export let isThunk = (node) =>
{
    return node.type === 'thunk';
}

/**
 * Is functional thunk.
 *  
 * @param   {object}  node
 * @returns {boolean}
 */
export let isFunctionalThunk = (node) =>
{
    return node.type === 'thunk' && node.__internals.fn !== null
}

/**
 * Is native Vnode.
 *  
 * @param   {object}  node
 * @returns {boolean}
 */
export let isNative = (node) =>
{
    return node.type === 'native';
}

/**
 * Is text Vnode.
 *  
 * @param   {object}  node
 * @returns {boolean}
 */
export let isText = (node) =>
{
    return node.type === 'text';
}

/**
 * Is empty Vnode.
 *  
 * @param   {object}  node
 * @returns {boolean}
 */
export let isEmpty = (node) =>
{
    return node.type === 'empty';
}

/**
 * Has no children.
 *  
 * @param   {object}  node
 * @returns {boolean}
 */
export let noChildren = (node) =>
{
    return node.children.length === 1 && isEmpty(node.children[0]);
}

/**
 * Has single child.
 *  
 * @param   {object}  node
 * @returns {boolean}
 */
export let singleChild = (node) =>
{
    return node.children.length === 1 && !isEmpty(node.children[0]);
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
 * @param   {object}  node
 * @returns {boolean}
 */
export let isThunkInstantiated = (vnode) =>
{
    return nodeComponent(vnode) !== null;
}

/**
 * Checks if a thunk Vnode is only nesting a fragment.
 *  
 * @param   {object}  node
 * @returns {boolean}
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
 * Thunk function name.
 *  
 * @param   {object}  node
 * @returns {string}
 */
export let thunkName = (node) =>
{
    return node.__internals._name;
}

/**
 * Set/get node element.
 *  
 * @param   {object}                   node
 * @param   {HTMLElement | undefined}  Elem 
 * @returns {HTMLElement}
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
 * Set/get native Vnodes attributes.
 *  
 * @param   {object}              node
 * @param   {object | undefined}  attrs 
 * @returns {object}
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
 * Set/get Vnode's component.
 *  
 * @param   {object}              node
 * @param   {object | undefined}  component 
 * @returns {object}
 */
export let nodeComponent = (node, component) =>
{
    if (!_.is_undefined(component))
    {
        node.__internals._component = component;
    }

    return node.__internals._component;
}

/**
 * Set/get component's Vnode.
 *  
 * @param   {object}              component
 * @param   {object | undefined}  node 
 * @returns {object}
 */
export let componentNode = (component, node) =>
{
    if (!_.is_undefined(node))
    {
        component.__internals.vnode = node;
    }

    return component.__internals.vnode;
}


/**
 * Returns the parent DOMElement of a given vnNode.
 *  
 * @param   {object}  vnode
 * @returns {HTMLElement}
 */
export let parentElem = (vnode) =>
{
    // Native node
    if (isNative(vnode) || isText(vnode) || isEmpty(vnode))
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
 * Returns index of Vnode relative to parent / siblings.
 *  
 * @param   {object}  node
 * @returns {number}
 */
export let domIndex = (node) =>
{
    let parentDOMElement = parentElem(node);

    let domSiblings = Array.prototype.slice.call(parentDOMElement.children);

    let thisEl = nodeElem(node);

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
 * @param   {object}  node
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
        nodeElem(vnode);
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
    component.__internals.vnode = vnode;

    // Point vnode.children -> component.props.children
    if (component.props && component.props.children)
    {
        vnode.children = component.props.children;
    }
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

/**
 * Recursively calls "componentDidMount" on nested components
 * in a sub tree.
 */
export let nodeDidMount = (vnode) =>
{
    if (isThunk(vnode) || isFragment(vnode))
    {
        let component = nodeComponent(vnode);

        if (component && _.is_callable(component.componentDidMount))
        {
            component.componentDidMount();
        }

        if (!noChildren(vnode))
        {
            _.foreach(vnode.children, function(i, child)
            {
                nodeDidMount(child);
            });
        }
    }
    else if (isNative(vnode) && !noChildren(vnode))
    {
        _.foreach(vnode.children, function(i, child)
        {
            nodeDidMount(child);
        });
    }
}