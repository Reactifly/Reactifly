
export let currentComponent;

export function useState(initial)
{
    const i = currentComponent.hookIndex++;
    
    if (!currentComponent.hooks[i])
    {
        currentComponent.hooks[i] =
        {
            state: transformState(initial)
        };
    }
    
    const thisHookContext = currentComponent;
    
    return [
        currentComponent.hooks[i].state,
        
        useCallback(newState =>
        {
            thisHookContext.hooks[i].state = transformState(newState, thisHookContext.hooks[i].state);

            thisHookContext.setState();

        }, [])
    ];
}

function useCallback(cb, deps)
{
    return useMemo(() => cb, deps);
}

function useMemo(factory, deps)
{
    const i = currentComponent.hookIndex++;
    
    if ( !currentComponent.hooks[i] || !deps || !sameArray(deps, currentComponent.hookDeps[i]))
    {
        currentComponent.hooks[i] = factory();

        currentComponent.hookDeps[i] = deps;
    }
    
    return currentComponent.hooks[i];
}

function transformState(state, prevState)
{
    if (typeof state === "function")
    {
        return state(prevState);
    }

    return state;
}

function sameArray(arr1, arr2)
{
    if (arr1.length !== arr2.length)
    {
        return false;
    }

    for (let i = 0; i < arr1.length; ++i)
    {
        if (arr1[i] !== arr2[i])
        {
            return false;
        }
    }

    return true;
}