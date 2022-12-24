import { thunkUpdate, componentNode } from '../vdom/index';
import { is_equal } from '../utils/index';

export const renderQueue = {
    current: null
};

export function useState(initial)
{
    const i = renderQueue.current.hookIndex++;

    if (!renderQueue.current.hooks[i])
    {
        renderQueue.current.hooks[i] = {
            state: transformState(initial)
        };
    }

    const thisHookContext = renderQueue.current;

    return [

        renderQueue.current.hooks[i].state,

        useCallback(newState =>
        {
            thisHookContext.hooks[i].state = transformState(newState, thisHookContext.hooks[i].state);

            thisHookContext.forceUpdate();

        }, [])
    ];
}

function useCallback(cb, deps)
{
    return useMemo(() => cb, deps);
}

function useMemo(factory, deps)
{
    const i = renderQueue.current.hookIndex++;
    if (
        !renderQueue.current.hooks[i] ||
        !deps ||
        !is_equal(deps, renderQueue.current.hookDeps[i])
    )
    {
        renderQueue.current.hooks[i] = factory();
        renderQueue.current.hookDeps[i] = deps;
    }

    return renderQueue.current.hooks[i];
}

// end public api

function transformState(state, prevState)
{
    if (typeof state === "function")
    {
        return state(prevState);
    }

    return state;
}

// end HOOKS