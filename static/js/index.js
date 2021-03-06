queue()
	.defer(d3.csv, "data/london-housing.csv")
	.await(makeGraphs);

function makeGraphs(error, housingData) {
	var ndx = crossfilter(housingData);

	housingData.forEach(function (d) {
		d.carbonEmissions = parseInt(d.carbonEmissions);
		d.cars = parseInt(d.cars);
		d.population = parseInt(d.population);
	});

	show_emissions_per_borough(ndx);
	show_cars_per_borough(ndx);
	show_average_population(ndx);

	// Scatter plot
	show_population_emissions_correlation(ndx);

	dc.renderAll();
}


// Chart emmissions Per Borough:
function show_emissions_per_borough(ndx) {
	var borough_dim = ndx.dimension(dc.pluck('borough'));
	var borough_emissions_group = borough_dim.group().reduceSum(dc.pluck('carbonEmissions'));
	dc.barChart('#emissions-borough')
		.width(600)
		.height(450)
		.margins({
			top: 30,
			right: 50,
			bottom: 120,
			left: 70
		})
		.dimension(borough_dim)
		.group(borough_emissions_group)
		.transitionDuration(600)
		.x(d3.scale.ordinal())
		.xUnits(dc.units.ordinal)
		.xAxisLabel("Borough")
		.yAxisLabel("Emissions")
		.yAxis().ticks(40);
}


// Chart Cars Per Borough:
function show_cars_per_borough(ndx) {
	var borough_dim = ndx.dimension(dc.pluck('borough'));
	var borough_cars_group = borough_dim.group().reduceSum(dc.pluck('cars'));
	dc.barChart('#cars-borough')
		.width(600)
		.height(450)
		.margins({
			top: 30,
			right: 50,
			bottom: 120,
			left: 70
		})
		.dimension(borough_dim)
		.group(borough_cars_group)
		.transitionDuration(600)
		.x(d3.scale.ordinal())
		.xUnits(dc.units.ordinal)
		.xAxisLabel("Borough")
		.yAxisLabel("Cars")
		.yAxis().ticks(40);
}


// Average Population Per Location:
function show_average_population(ndx) {
	var location_dim = ndx.dimension(dc.pluck('location'));

	// Add data entry
	function add_item(p, v) {
		p.count++;
		p.total += v.population;
		p.average = p.total / p.count;
		return p;
	}

	// Remove data entry
	function remove_item(p, v) {
		p.count--;
		if (p.count == 0) {
			p.total = 0;
			p.average = 0;
		} else {
			p.total -= v.population;
			p.average = p.total / p.count;
		}
		return p;
	}

	// Initialise the values
	function initialise() {
		return {
			count: 0,
			total: 0,
			average: 0
		};
	}


	// Chart for Average Population
	var populationByLocationGroup = location_dim.group().reduce(add_item, remove_item, initialise);

	dc.barChart("#average-population")
		.width(400)
		.height(250)
		.margins({
			top: 10,
			right: 50,
			bottom: 30,
			left: 50
		})
		.barPadding(0.1)
		.outerPadding(0.1)
		.dimension(location_dim)
		.group(populationByLocationGroup)
		.valueAccessor(function (d) {
			return d.value.average.toFixed(3)
		})
		.transitionDuration(600)
		.x(d3.scale.ordinal())
		.xUnits(dc.units.ordinal)
		.elasticY(true)
		.xAxisLabel("Inner/Outer")
		.yAxisLabel("Population")
		.yAxis().ticks(10).tickFormat(d3.format(',3s'));
}


// Population Emissions Correlation:
function show_population_emissions_correlation(ndx) {

	var emissions_dim = ndx.dimension(dc.pluck("carbonEmissions"));
	var pollution_dim = ndx.dimension(function (d) {
		return [d.carbonEmissions, d.population, d.borough];
	});

	var emissionsPollutionGroup = pollution_dim.group();

	console.log(emissionsPollutionGroup.all());

	var minEmissions = emissions_dim.bottom(1)[0].carbonEmissions;
	var maxEmissions = emissions_dim.top(1)[0].carbonEmissions;

	dc.scatterPlot("#population-emissions")
		.width(1000)
		.height(400)
		.margins({
			top: 10,
			right: 50,
			bottom: 75,
			left: 75
		})
		.x(d3.scale.linear().domain([minEmissions, maxEmissions]))
		.brushOn(false)
		.symbol("square")
		.symbolSize(8)
		.clipPadding(10)
		.elasticY(true)
		.yAxisLabel("Population")
		.xAxisLabel("Emissions")
		.title(function (d) {
			return d.key[2] + " pollutes " + d.key[1] + " people";
		})
		.dimension(pollution_dim)
		.group(emissionsPollutionGroup);

}