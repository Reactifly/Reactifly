/*getDerivedStateFromProps()
componentWillUnmount()
componentDidMount()
componentWillReceiveProps(nextProps)
getSnapshotBeforeUpdate(prevProps, prevState)
shouldComponentUpdate(nextProps, nextState)
componentWillUpdate(changedProps, changedState)
componentDidUpdate(prevProps, prevState, snapshot)
componentDidCatch()*/


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