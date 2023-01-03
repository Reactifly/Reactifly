import { nodeComponent } from './utils';
import { jsx as parseJSX } from '../jsx/index';
import { diff } from '../diff/index';
import { RENDER_QUEUE } from '../internal';
import _ from '../utils/index';

/**
 * Instantiate thunk component.
 * 
 * @param   {object}  vnode
 * @returns {import('../compat/Compoent').Component}
 */
export function thunkInstantiate(vnode)
{
    let component = nodeComponent(vnode);

    if (!component)
    {
        let { fn, props } = vnode;

        component = _.is_constructable(fn) ? new fn(props) : fn(props);
    }

    vnode.children = [jsxFactory(component)];

    return component;
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

    if (component.__internals._fn)
    {
        return component.render();
    }

    const jsxStr = component.render();

    const context = renderContext(component);

    const result = parseJSX(jsxStr, { ...context, this: component });

    if (_.is_array(result))
    {
        throw new Error('SyntaxError: Adjacent JSX elements must be wrapped in an enclosing tag. Did you want a JSX fragment <>...</>?');
    }

    return result;
}

/**
 * Returns component context variables/dependencies for render function.
 * 
 * @param   {object} component
 * @returns {object}
 */
export function renderContext(component)
{
    let ret = {};
    let props = _.object_props(component);

    _.foreach(props, function(i, key)
    {
        if (key !== 'render' && key !== 'children')
        {
            ret[key] = component[key];
        }
    });

    return ret;
}