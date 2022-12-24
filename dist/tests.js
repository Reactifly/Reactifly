(function()
{
    const List = function(props)
    {
        return Reactifly.jsx(`
            <ol>
                {props.values.map(value => (
                    <li key={value}>{value}</li>
                ))}
            </ol>
        `);
    };

    let values = ['a', 'b'];

    Reactifly.register(List);

    Reactifly.register(values, 'values');

    Reactifly.render('<List values={values} />', document.body);

})();