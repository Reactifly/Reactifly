import * as vDOM from '../vdom/utils';
import { jsx as parseJSX } from '../jsx/index';
import { diff } from '../diff/index';
import { RENDER_QUEUE, GLOBAL_CONTEXT } from '../internal';
import _ from '../utils/index';

/**
 * Instantiate thunk component.
 * 
 * @param   {object}  vnode
 * @returns {import('../compat/Compoent').Component}
 */
export function thunkInstantiate(vnode)
{
    let component = vDOM.nodeComponent(vnode);

    if (!component)
    {
        let { fn, props } = vnode;

        let contextVal = childContext(fn);

        component = _.is_constructable(fn) ? new fn(props, contextVal) : fn(props, contextVal);

        if (component.getChildContext != null)
        {            
            GLOBAL_CONTEXT.current = component.getChildContext();
        }
        else
        {
            subscribeToContext(fn, component);
        }
    }

    vnode.children = [jsxFactory(component)];

    return component;
}

/**
 * Component context.
 * 
 * @param   {object}        component
 * @returns {object|array}
 */
function childContext(componentFunc)
{
    let ret = null;

    if (componentFunc.contextType)
    {
        let context = componentFunc.contextType;

        if (!GLOBAL_CONTEXT.current)
        {
            ret = context._defaultValue;
        }
        else
        {
            let provider = GLOBAL_CONTEXT.current;

            ret = provider.props ? provider.props.value : context._defaultValue;
        }
    }

    return ret;
}

/**
 * Subscribes component to context changes.
 * 
 * @param  {function}  fn         Uninstantiated component function
 * @param  {object}    component  Instantiated component
 */
function subscribeToContext(fn, component)
{
    if (fn.contextType && GLOBAL_CONTEXT.current)
    {
        GLOBAL_CONTEXT.current.sub(component);
    }
}

/**
 * Renders thunk.
 * 
 * @param   {object}        component
 * @returns {object|array}
 */
export function thunkRender(component)
{
    return jsxFactory(component);
}

/**
 * Re-renders thunk and commits patches.
 * 
 * @param  {object}  vnode
 */
export function thunkUpdate(vnode)
{
    let component = vnode.__internals._component;
    let left = vnode.children[0];
    let right = jsxFactory(component);

    diff(left, right);
}

/**
 * Parses component JSX from render.
 * 
 * @param   {object}        component
 * @returns {object|array}
 */
function jsxFactory(component)
{
    RENDER_QUEUE.current = component;

    // Functional component wrapper
    if (component.__internals._fn)
    {
        return component.render();
    }

    const jsxStr = component.render();

    const result = parseJSX(jsxStr);

    if (_.is_array(result))
    {
        throw new Error('SyntaxError: Adjacent JSX elements must be wrapped in an enclosing tag. Did you want a JSX fragment <>...</>?');
    }

    return result;
}