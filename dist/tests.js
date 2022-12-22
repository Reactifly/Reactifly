(function()
{
    const List = function(props)
    {
        let vars = 
        {
            props : props
        };

        return Reactifly.jsx(`
            <ol>
                {props.values.map(value => (
                    <li key={value}>{value}</li>
                ))}
            </ol>
        `, vars);
    };

    let values = ['a', 'b'];

    Reactifly.render('<List values={values} />', document.body, {List: List, values : values});

})();