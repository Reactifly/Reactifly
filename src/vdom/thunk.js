import { createElement } from './element';
import { nodeComponent, isNative, isThunk, isFragment } from './utils';
import { parseJSX } from '../jsx/index';
import { commit } from '../dom/index';
import { patch } from './patch';
import _ from '../utils/index';

export function thunkInstantiate(vnode)
{
    let component = nodeComponent(vnode);

    if (!component)
    {
        let { fn, props } = vnode;

        props = _.cloneDeep(props);

        component = _.is_constructable(fn) ? new fn(props) : fn(props);
    }

    component.props.children = [jsxFactory(component)];

    return component;
}

export function thunkUpdate(vnode)
{
    let component = vnode.__internals._component;
    let left      = vnode.children[0];
    let right     = jsxFactory(component);
    let actions   = tree(left, right);

    if (!_.is_empty(actions.current))
    {
        commit(actions.current);
    }

    console.log(vnode);
}

export function thunkRender(component)
{
    return jsxFactory(component);
}

function tree(left, right)
{ 
    let actions = 
    {
        current : []
    };

    patch(left, right, actions.current);

    return actions;
}

function jsxFactory(component)
{    
    if (component.__internals._fn)
    {
        return component.render();
    }

    const jsx = component.render();

    if (jsx.trim() === '')
    {
        return createElement();
    }

    const context = renderContext(component);

    const result = parseJSX(jsx, {...context, this: component });

    if (_.is_array(result))
    {
        throw new Error('SyntaxError: Adjacent JSX elements must be wrapped in an enclosing tag. Did you want a JSX fragment <>...</>?');
    }

    return result;
}

export function renderContext(component)
{
    let ret   = {};
    let props = _.object_props(component);

    _.foreach(props, function(i, prop)
    {
        if (prop !== 'render')
        {
            ret[prop] = component[prop];
        }
    });

    return ret;
}
