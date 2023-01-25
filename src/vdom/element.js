import { isEmpty, isFragment, isValidVnode } from './utils';
import { functionalComponent } from '../compat/functionalComponent';
import { STRICT_MODE } from '../internal';
import _ from '../utils/index';

/**
 * JSX create element.
 *  
 * @param   {string | function}   tag         Root html element
 * @param   {object | undefined}  props       Tag props / attributes
 * @param   {array | undefined}  ...children  Tag children (recursive)
 * @returns {object}
 */
export function createElement(tag, props)
{        
    if (arguments.length === 0)
    {
        return createEmptyVnode();
    }

    let normalizedProps = {};
    let children = [];
    let key;
    let ref;
    
    // Normalise props
    _.foreach(props, function(k, prop)
    {
        if (k == 'key')
        {
            key = prop + '';
        }
        else if (k == 'ref')
        {
            ref = prop;
        }
        else if (k == 'children')
        {
            normalizedProps[k] = normaliseChildren(prop, true);
        }
        else
        {
            normalizedProps[k] = prop;
        }
    });

    // Get children
    if (arguments.length > 2)
    {
        children = [].slice.call(arguments, 2);
    }
    
    // Special case for text
    if (tag === 'text')
    {
        return createTextVnode(children.toString(), key);
    }

    // thunk / fragment
    if (_.is_callable(tag))
    {
        // If a Component VNode, check for and apply defaultProps
        // Note: type may be undefined in development, must never error here.
        if (_.is_object(tag.defaultProps))
        {
            _.foreach(tag.defaultProps, function(k, prop)
            {
                if (_.is_undefined(normalizedProps[k]))
                {
                    normalizedProps[k] = prop;
                }
            });
        }

        if (_.is_class(tag, 'Fragment'))
        {
            children = normaliseChildren(children, false, true);
        }
        else
        {
            // Children was supplied as prop during JSX parse
            if (_.array_filter(children).length >= 1)
            {
                normalizedProps.children = normaliseChildren(children, true);
            }
            else
            {
                children = [createEmptyVnode()];
            }
        }

        if (!_.is_constructable(tag))
        {
            return createFunctionalThunk(tag, normalizedProps, children, key, ref);
        }

        return createThunkVnode(tag, normalizedProps, children, key, ref);
    }

    children = normaliseChildren(children);

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
            _prevAttrs: '',
            _isValidVnode: true
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
 * @param   {boolean | undefined}  propkeys   Apply keys as children is from props
 * @param   {boolean | undefined}  checkKeys  Check keys on child when a fragment is found
 * @returns {array}
 */
function normaliseChildren(children, propKeys, checkKeys)
{    
    if (children.length === 0)
    {
        return [createEmptyVnode()];
    }

    checkKeys = _.is_undefined(checkKeys) ? false : checkKeys;

    propKeys = _.is_undefined(propKeys) ? false : propKeys;

    let fragmentcount = 0;

    let ret = [];

    let warnKeys = false;

    _.foreach(children, function(i, child)
    {   
        if (_.is_null(child) || _.is_undefined(child) || _.is_bool(child))
        {
            ret.push(createEmptyVnode());
        }
        else if (_.is_string(child) || _.is_number(child))
        {
            ret.push(createTextVnode(child, null));
        }
        else if (_.is_callable(child))
        {
            ret.push(child);
        }
        // Inline function, map or props.children
        else if (_.is_array(child))
        {
            let _children = normaliseChildren(child, propKeys, true);

            _.array_merge(ret, _children);
        }
        else if (isFragment(child))
        {
            squashFragment(child, ret, fragmentcount);

            fragmentcount++;
        }
        else if (isValidVnode(child))
        {
            if (propKeys && _.is_undefined(child.key))
            {
                child.key = `_pk|${i}`;
            }
            else if (checkKeys && _.is_undefined(child.key))
            {
                warnKeys = true;
            }

            ret.push(child);
        }
        else
        {            
            ret.push(child);
        }
    });

    if (warnKeys && STRICT_MODE)
    {
        console.error('Warning: Each child in a list should have a unique [key] prop.');
    }

    return _.is_empty(ret) ? [createEmptyVnode()] : ret;
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

    let _children = normaliseChildren(fragment.children, false, false);

    _.foreach(_children, function(i, vnode)
    {
        vnode.key = `${basekey}|${i}`;
    });

    _.array_merge(ret, _children);
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
        nodeValue: text.trim(),
        key: key,
        __internals:
        {
            _domEl: null,
            _isValidVnode: true
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
            _domEl: null,
            _isValidVnode: true
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

    // Must extend component
    if (!_.is_class(fn, 'Component'))
    {                
        throw new Error('[' + _.callable_name(fn) + '] is not a valid Component. Class or construable components must extend [Reactifly.Component]');
    }

    // Components need a render function
    if (_type === 'thunk' && !_.is_function(fn.prototype.render))
    {                
        throw new Error('[' + _.callable_name(fn) + '] does not have a [render] method. Class or construable components must have a render method.');
    }

    return {
        type: _type,
        fn,
        children,
        props,
        ref,
        key,
        __internals:
        {
            _domEl: null,
            _component: null,
            _name: _.callable_name(fn),
            _fn: null,
            _isValidVnode: true
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
        ref,
        key,
        __internals:
        {
            _domEl: null,
            _component: null,
            _name: _.callable_name(fn),
            _fn: fn,
            _isValidVnode: true
        }
    }
}

export default createElement;