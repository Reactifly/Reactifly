setTimeout(function()
{
    const t0 = performance.now();

    class Nest2 extends Reactifly.Component
    {
        render()
        {
            return `<span>{this.props.TestProp}</span>`;
        }
    }

    class Nest1 extends Reactifly.Component
    {
        Nest2 = Nest2;

        render()
        {
            return `<div><Nest2 TestProp={this.props.TestProp} /></div>`;
        }
    }

    class Bar extends Reactifly.Component
    {
        Nest1 = Nest1;

        started = false;

        state = { counter : 0 };

        updateState()
        {
            for (var i = 0; i < 42; i++)
            {
                this.setState('counter', i);
            }

            const t1 = performance.now();

            console.log(`Reactifly took ${t1 - t0} milliseconds.`);
        }
        
        render()
        {        
            console.log('rendering');

            if (!this.started)
            {
                this.started = true;

                let _this = this;

                setTimeout(function()
                {
                    _this.updateState();
                
                }, 1);
            }

            return `<div><Nest1 TestProp={this.state.counter} /></div>`;
        }
    }

    let root = Reactifly.createRoot(document.body);

    root.render(Bar);

}, 500);

setTimeout(function()
{
    let t0 = performance.now();

    class Nest2 extends React.Component
    {
        render()
        {
            return React.createElement('span', null, this.props.TestProp);
        }
    }

    class Nest1 extends React.Component
    {
        Nest2 = Nest2;

        render()
        {
            return React.createElement('div', null, React.createElement(Nest2, {TestProp : this.props.TestProp}));
        }
    }

    class Bar extends React.Component
    {
        Nest1 = Nest1;

        started = false;

        state = { counter : 0 };

        componentDidMount()
        {
            let _this = this;

            setTimeout(function()
            {
                _this.setState({counter: _this.state.counter + 1 });
            
            }, 1);
        }

        componentDidUpdate(prevProps, prevState, snapshot)
        {
            if (prevState.counter < 39)
            {
                this.setState({counter: this.state.counter + 1 });
            }
            else
            {
                const t1 = performance.now();

                console.log(`React Native took ${t1 - t0} milliseconds.`);
            }
        }
        
        render()
        {
            console.log('rending');

            return React.createElement('div', null, React.createElement(Nest1, {TestProp : this.state.counter}));
        }
    }

    let root = ReactDOM.createRoot(document.body);

    root.render(React.createElement(Bar));

}, 10);

/*
(function()
{
    const Result = ({ result }) =>
    {
        return Reactifly.jsx(`
            <div class="result">
                <div>
                    <a href={result.html_url} target="_blank">{result.full_name}</a> 🌟<strong>{result.stargazers_count}</strong>
                </div>
                <p>{result.description}</p>
            </div>
        `);
    };

    const initialState = { count: 0 };

    function reducer(state, action)
    {
        switch (action.type)
        {
            case "reset":
                return { count: action.payload };
            case "increment":
                return { count: state.count + 1 };
            case "decrement":
                return { count: state.count - 1 };
            default:
                // A reducer must always return a valid state.
                // Alternatively you can throw an error if an invalid action is dispatched.
                return state;
        }
    }

    function App(props, { results = [] })
    {
        useEffect(() =>
        {
            fetch(`${SEARCH}?q=preact`)
            .then(r => r.json())
            .then(json => {
                this.setState({
                    results: (json && json.items) || []
                });
            });
        }, []);

        const [state, dispatch] = useReducer(reducer, initialState,
        {
            type: "reset",
            payload: 100
        });

        const [value, setValue] = useState(() => 10);

        const inputEl = useRef(null);
        
        const onButtonClick = () =>
        {
            // `current` points to the mounted text input element
            inputEl.current.focus();
        };

        useLayoutEffect(
            () => {
                console.log(inputEl.current.getBoundingClientRect().width);
            },
            [value]
        );

        return Reactifly.jsx(`
            <div>
                <h1 onClick={() => setValue(value => value + 1)}>Example {value}</h1>
                Count: {state.count}
                <button onClick={() => dispatch({ type: "reset", payload: 100 })}>Reset</button>
                <button onClick={() => dispatch({ type: "increment" })}>+</button>
                <button onClick={() => dispatch({ type: "decrement" })}>-</button>
                <p>
                    <input ref={inputEl} type="text" />
                    <button onClick={onButtonClick}>Focus the input</button>
                </p>
                <div class="list">
                    {results.map(result => (
                        <Result result={result} />
                    ))}
                </div>
            </div>
      `);
    }

    const SEARCH = "//api.github.com/search/repositories";

    if (typeof window !== "undefined")
    {
        Reactifly.render(App, document.body);
    }

})();*/