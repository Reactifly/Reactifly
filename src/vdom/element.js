import { isEmpty, isFragment } from './utils';
import { functionalComponent } from '../compat/index';
import _ from '../utils/index';

/**
 * JSX create element.
 *  
 * @param   {string | function}   tag         Root html element
 * @param   {object | undefined}  props       Tag props / attributes
 * @param   {array | undefined}  ...children  Tag children (recursive)
 * @returns {object}
 */
export function createElement(tag, props, ...children)
{
    if (arguments.length === 0)
    {
        return createEmptyVnode();
    }

    let normalizedProps = {},
        key,
        ref,
        i;

    for (i in props)
    {
        if (i == 'key')
        {
            key = props[i];
        }
        else if (i == 'ref')
        {
            ref = props[i];
        }
        else
        {
            normalizedProps[i] = props[i];
        }
    }

    children = typeof children === 'undefined' ? [] : children;

    if (arguments.length > 2)
    {
        children = arguments.length > 3 ? [].slice.call(arguments, 2) : children;
    }

    children = normaliseChildren(children);

    // If a Component VNode, check for and apply defaultProps
    // Note: type may be undefined in development, must never error here.
    if (_.is_callable(tag) && _.is_object(tag.defaultProps))
    {
        for (i in tag.defaultProps)
        {
            if (_.is_undefined(normalizedProps[i]))
            {
                normalizedProps[i] = tag.defaultProps[i];
            }
        }
    }

    if (typeof tag === 'function')
    {
        if (!_.is_constructable(tag))
        {
            return createFunctionalThunk(tag, normalizedProps, children, key, ref);
        }

        return createThunkVnode(tag, normalizedProps, children, key, ref);
    }

    return {
        type: 'native',
        tagName: tag,
        attributes: normalizedProps,
        children,
        ref,
        key,
        __internals:
        {
            _domEl: null,
            _prevAttrs: ''
        }
    }
}

/**
 * Cleans up the array of child elements.
 * 
 * - Flattens nested arrays
 * - Flattens nested fragments
 * - Converts raw strings and numbers into vnodes
 * - Filters out undefined elements
 *  
 * @param   {array}                children   Child vnodes
 * @param   {boolean | undefined}  checkKeys  Check keys on child when a fragment is found
 * @returns {array}
 */
function normaliseChildren(children, checkKeys)
{
    checkKeys = _.is_undefined(checkKeys) ? false : checkKeys;

    let fragmentcount = 0;

    var ret = [];

    if (_.is_array(children))
    {
        _.foreach(children, function(i, vnode)
        {
            if (_.is_null(vnode) || _.is_undefined(vnode))
            {
                ret.push(createEmptyVnode());
            }
            else if (checkKeys && !vnode.key)
            {
                throw new Error('Each child in a list should have a unique "key" prop.')
            }
            else if (_.is_string(vnode) || _.is_number(vnode))
            {
                ret.push(createTextVnode(vnode, null));
            }
            else if (_.is_array(vnode))
            {
                let _children = normaliseChildren(vnode, true);

                _.array_merge(ret, _children);
            }
            else if (isFragment(vnode))
            {
                squashFragment(vnode, ret, fragmentcount);

                fragmentcount++;
            }
            else
            {
                ret.push(vnode);
            }
        });
    }

    return _.is_empty(ret) ? [createEmptyVnode()] : filterChildren(ret);
}

/**
 * Squashes a fragment into stack and applies special fragment keys to it.
 *  
 * @param {object}  fragment  Fragment Vnode
 * @param {array}   ret       Return array to modify
 * @param {number}  fCount    Number of direct fragment childs in parent
 */
function squashFragment(fragment, ret, fCount)
{
    let basekey = !fragment.key ? `f_${fCount}` : fragment.key;

    let _children = normaliseChildren(fragment.children, false);

    _.foreach(_children, function(i, vnode)
    {
        vnode.key = `${basekey}|${i}`;
    });

    _.array_merge(ret, _children);
}

/**
 * If a node comprises of multiple empty children, filter
 * children and return only a single "empty" child
 */

/**
 * Ensures we return only a single empty Vnode child (instead of multiple) when
 * children are empty
 *  
 * @param   {array}  children  Child Vnodes
 * @returns {array}
 */
function filterChildren(children)
{
    // Empty
    let ret = [children[0]];

    _.foreach(children, function(i, vnode)
    {
        if (!isEmpty(vnode))
        {
            ret = children;

            return false;
        }
    });

    return ret;
}

/**
 * Creates text Vnode.
 *  
 * @param   {string}              text Node text 
 * @param   {string | undefined}  key  Node key   
 * @returns {object}
 */
function createTextVnode(text, key)
{
    text = _.is_string(text) ? text : text + '';

    return {
        type: 'text',
        nodeValue: text + '',
        key: key,
        __internals:
        {
            _domEl: null
        }
    }
}

/**
 * Creates empty Vnode.
 * 
 * @returns {object}
 */
function createEmptyVnode()
{
    return {
        type: 'empty',
        key: null,
        __internals:
        {
            _domEl: null
        }
    }
}

/**
 * Creates thunk Vnode with component class.
 * 
 * @param   {function}            fn        Component function
 * @param   {object}              props     Component props
 * @param   {array}               children  Vnode children
 * @param   {string | undefined}  key       Node key
 * @param   {object | undefined}  ref       Node ref   
 * @returns {object}
 */
function createThunkVnode(fn, props, children, key, ref)
{
    let _type = _.is_class(fn, 'Fragment') ? 'fragment' : 'thunk';

    return {
        type: _type,
        fn,
        children,
        props,
        key,
        __internals:
        {
            _domEl: null,
            _component: null,
            _name: _.callable_name(fn),
            _fn: null,
        }
    }
}

/**
 * Creates thunk Vnode with function.
 * 
 * @param   {function}            fn        Component function
 * @param   {object}              props     Component props
 * @param   {array}               children  Vnode children
 * @param   {string | undefined}  key       Node key
 * @param   {object | undefined}  ref       Node ref   
 * @returns {object}
 */
function createFunctionalThunk(fn, props, children, key, ref)
{
    let func = functionalComponent(fn);

    return {
        type: 'thunk',
        fn: func,
        children: null,
        props,
        key,
        __internals:
        {
            _domEl: null,
            _component: null,
            _name: _.callable_name(fn),
            _fn: fn,
        }
    }
}

export default createElement;