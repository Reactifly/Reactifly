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

        let isContext = vDOM.isContextProvder(vnode);

        let context = isContext ? null : __context(fn);

        component = _.is_constructable(fn) ? new fn(props, context) : fn(props, context);

        if (isContext)
        {
            GLOBAL_CONTEXT.current = fn._contextRef;
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
function __context(component)
{
    if (component.contextType)
    {
        if (!component.contextType.Provider || !component.contextType.Consumer)
        {
            throw new Error('Context Error: [contextType] must be a valid context from [createContext()]');
        }

        let context = component.contextType.Provider._contextRef;

        return context.Provider.props ? context.Provider.props.value : context._defaultValue;
    }
    else if (GLOBAL_CONTEXT.current)
    {
        let context = GLOBAL_CONTEXT.current;

        return context.Provider.props ? context.Provider.props.value : context._defaultValue;
    }

    return null;
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

    GLOBAL_CONTEXT.current = null;
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

    if (!_.is_string(jsxStr))
    {
        if (vDOM.isValidVnode(jsxStr))
        {
            return jsxStr;
        }
        else if (_.is_array(jsxStr) && jsxStr.length === 1 && vDOM.isValidVnode(jsxStr[0]))
        {
            return jsxStr[0];
        }

        throw new Error('Component Error: [Component.render()] should return JSX or a valid Component.');
    }

    const result = parseJSX(jsxStr);

    if (_.is_array(result))
    {
        throw new Error('SyntaxError: Adjacent JSX elements must be wrapped in an enclosing tag. Did you want a JSX fragment <>...</>?');
    }

    return result;
}