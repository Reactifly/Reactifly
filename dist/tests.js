const car_brands = ['Holden', 'Ford', 'Kia'];
const car_models = ['Commodore', 'Mustang', 'i500'];
const car_colors = ['Yellow', 'Green', 'Red'];
const car_years  = ['1999', '1998', '1995'];

function Car1()
{
    console.log('rending car');

    const btnEl = reactifly.useRef(null);
        
    const onButtonClick = () =>
    {
       console.log(btnEl.current);
    };
    
    const [brand, setBrand] = reactifly.useState(car_brands[Math.floor(Math.random()*car_brands.length)]);
    const [model, setModel] = reactifly.useState(car_models[Math.floor(Math.random()*car_models.length)]);
    const [year, setYear]   = reactifly.useState(car_years[Math.floor(Math.random()*car_years.length)]);
    const [color, setColor] = reactifly.useState(car_colors[Math.floor(Math.random()*car_colors.length)]);

    const genCar = function()
    {
        setBrand(car_brands[Math.floor(Math.random()*car_brands.length)]);
        setModel(car_models[Math.floor(Math.random()*car_models.length)]);
        setYear(car_years[Math.floor(Math.random()*car_years.length)]);
        setColor(car_colors[Math.floor(Math.random()*car_colors.length)]);

        onButtonClick();
    };

    let vars = 
    {
        brand  : brand,
        model  : model,
        year   : year,
        color  : color,
        genCar : genCar,
        btnEl  : btnEl
    };

    return reactifly.jsx(`
        <div>
            <h1>Car 2 My {brand}</h1>
            <p>
                It is a {color} {model} from {year}.
            </p>
            <button ref={btnEl} onClick={() => genCar()}>Generate Car</button>
        </div>`,
    vars);
}

function Car2()
{
    console.log('rending car');
    
    const [brand, setBrand] = reactifly.useState(car_brands[Math.floor(Math.random()*car_brands.length)]);
    const [model, setModel] = reactifly.useState(car_models[Math.floor(Math.random()*car_models.length)]);
    const [year, setYear]   = reactifly.useState(car_years[Math.floor(Math.random()*car_years.length)]);
    const [color, setColor] = reactifly.useState(car_colors[Math.floor(Math.random()*car_colors.length)]);

    const genCar = function()
    {
        setBrand(car_brands[Math.floor(Math.random()*car_brands.length)]);
        setModel(car_models[Math.floor(Math.random()*car_models.length)]);
        setYear(car_years[Math.floor(Math.random()*car_years.length)]);
        setColor(car_colors[Math.floor(Math.random()*car_colors.length)]);
    };

    let vars = 
    {
        brand  : brand,
        model  : model,
        year   : year,
        color  : color,
        genCar : genCar 
    };

    return reactifly.jsx(`
        <div>
            <h1>Car 1 My {brand}</h1>
            <p>
                It is a {color} {model} from {year}.
            </p>
            <button onClick={() => genCar()}>Generate Car</button>
        </div>`,
    vars);
}

class App extends reactifly.Component
{
    Car1 = Car1;
    Car2 = Car2;

    render()
    {
        return `
            <div>
                <Car1 />
                <Car2 />
            </div>
        `;
    }
}

let root = reactifly.createRoot(document.getElementById('app'));

root.render(App);

    /*setTimeout(function()
{
    const t0 = performance.now();

    class Nest2 extends reactifly.Component
    {
        render()
        {
            return `<span>{this.props.TestProp}</span>`;
        }
    }

    class Nest1 extends reactifly.Component
    {
        Nest2 = Nest2;

        render()
        {
            return `<div><Nest2 TestProp={this.props.TestProp} /></div>`;
        }
    }

    class Bar extends reactifly.Component
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

    let root = reactifly.createRoot(document.body);

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

}, 10);*/

/*
(function()
{
    const Result = ({ result }) =>
    {
        return reactifly.jsx(`
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

        const [value, setValue] = reactifly.useState(() => 10);

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

        return reactifly.jsx(`
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
        reactifly.render(App, document.body);
    }

})();*/