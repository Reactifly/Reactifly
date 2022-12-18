import { isEmpty, isFragment } from './utils';
import { functionalComponent } from '../compat/index';
import _ from '../utils/index';

/**
 * This function lets us create virtual nodes using a simple
 * syntax. It is compatible with JSX transforms so you can use
 * JSX to write nodes that will compile to this function.
 *
 * let node = element('div', { id: 'foo' }, [
 *   element('a', { href: 'http://google.com' },
 *     element('span', {}, 'Google'),
 *     element('b', {}, 'Link')
 *   )
 * ])
 */
export function createElement(tag, props, ...children)
{        
    if (arguments.length === 0)
    {
        return createEmptyElement();
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

        return createThunkElement(tag, normalizedProps, children, key, ref);
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
 * - Flattens nested arrays
 * - Flattens nested fragments
 * - Converts raw strings and numbers into vnodes
 * - Filters out undefined elements
 * - Fragments that are nested inside an normal node
 * - are essentially just array containers, so they get flattened here.
 * - if a component returns a fragment however that gets handled
 * - during the commit/patch/create stages.
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
                ret.push(createEmptyElement());
            }
            else if (checkKeys && !vnode.key)
            {
                throw new Error('Each child in a list should have a unique "key" prop.')
            }
            else if (_.is_string(vnode) || _.is_number(vnode))
            {
                ret.push(createTextElement(vnode, null));
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

    return _.is_empty(ret) ? [createEmptyElement()] : filterChildren(ret);
}

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
 * Text nodes are stored as objects to keep things simple
 */

function createTextElement(text, key)
{    
    text = _.is_string(text) ? text : text + '';

    return {
        type: 'text',
        nodeValue: text + '',
        key : key,
        __internals:
        {
            _domEl: null
        }
    }
}

/**
 * Text nodes are stored as objects to keep things simple
 */

function createEmptyElement()
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
 * Lazily-rendered virtual nodes
 */

function createThunkElement(fn, props, children, key, ref)
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
            _name : _.callable_name(fn),
            _fn : null,
            _hooks : [],
        }
    }
}

/**
 * Lazily-rendered virtual nodes
 */

function createFunctionalThunk(fn, props, children, key, ref)
{
    let func = functionalComponent(fn);

    return {
        type: 'thunk',
        fn : func,
        children : null,
        props,
        key,
        __internals:
        {
            _domEl: null,
            _component: null,
            _name : _.callable_name(fn),
            _fn : fn,
            _hooks : [],
        }
    }
}

export default createElement;