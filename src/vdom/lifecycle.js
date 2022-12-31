import * as vDOM from '../vdom/utils';
import _ from '../utils/index';

/**
 * Lifecycle for "componentDidMount".
 * 
 * Note this method does not recursively traverse the tree as children
 * get this method called when they are first instantiated anyway.
 * 
 * @param {object}  component  Component
 */
export function didMount(component)
{
    if (_.is_callable(component.componentDidMount))
    {
        component.componentDidMount();
    }
}

/**
 * Lifecycle for "componentWillUnmount".
 * 
 * Note this method is recursive as children don't get explicitly "unmounted".
 * 
 * @param {object}  vnode  Vnode that will unmount
 */
export function willUnMount(vnode)
{
    if (vDOM.isThunk(vnode) || vDOM.isFragment(vnode))
    {
        let component = vDOM.nodeComponent(vnode);

        if (component && _.is_callable(component.componentWillUnmount))
        {
            component.componentWillUnmount();
        }

        // Loop component props.children
        if (component.props.children)
        {
            _.foreach(component.props.children, function(i, child)
            {
                willUnMount(child);
            });
        }

        // Loop vnode children
        if (!vDOM.noChildren(vnode))
        {
            _.foreach(vnode.children, function(i, child)
            {
                willUnMount(child);
            });
        }
    }
    else if (vDOM.isNative(vnode) && !vDOM.noChildren(vnode))
    {
        _.foreach(vnode.children, function(i, child)
        {
            willUnMount(child);
        });
    }
}

/**
 * Lifecycle for "componentWillReceiveProps".
 * 
 * @param {object}  component  Component
 * @param {object}  nextProps  Next props
 */
export function willReceiveProps(component, nextProps)
{
    if (_.is_callable(component.componentWillReceiveProps))
    {
        component.componentWillReceiveProps(nextProps);
    }
}

/**
 * Lifecycle for "getSnapshotBeforeUpdate".
 * 
 * @param   {object}  component  Component
 * @param   {object}  prevProps  Previous props
 * @param   {object}  prevState  Previous state
 */
export function snapshotBeforeUpdate(component, prevProps, prevState)
{
    let snapshot = null;

    if (_.is_callable(component.getSnapshotBeforeUpdate))
    {
        snapshot = component.getSnapshotBeforeUpdate(prevProps, prevState);
    }

    component.__internals._snapshot = snapshot;
}

/**
 * Lifecycle for "componentWillUpdate".
 * 
 * @param   {object}  component  Component
 * @param   {object}  nextProps  Next props
 * @param   {object}  nextState  Next state
 */
export function willUpdate(component, nextProps, nextState)
{
    if (_.is_callable(component.componentWillUpdate))
    {
        component.componentWillUpdate(nextProps, nextState);
    }
}

/**
 * Lifecycle for "componentDidUpdate".
 * 
 * @param   {object}  component  Component
 * @param   {object}  prevProps  Prev props
 * @param   {object}  prevState  Prev state
 */
export function didUpdate(component, prevProps, prevState)
{
    if (_.is_callable(component.componentDidUpdate))
    {
        component.componentDidUpdate(prevProps, prevState, component.__internals._snapshot);
    }
}

/**
 * Lifecycle for "shouldComponentUpdate".
 * 
 * @param   {object}  component  Component
 * @param   {object}  nextProps  Next props
 * @param   {object}  nextState  Next state
 * @returns {boolean}
 */
export function shouldUpdate(component, nextProps, nextState)
{
    if (_.is_callable(component.shouldComponentUpdate))
    {
        return component.shouldComponentUpdate(nextProps, nextState);
    }

    return true;
}
