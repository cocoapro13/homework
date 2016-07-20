$(document).ready(function() {

  $('#dialog-new_program').dialog({
    autoOpen: false,
    modal: true
  });

  $('#btn-new_program').click(function() {
    $('#dialog-new_program').dialog('open');
  });

  widgetViewMore = function(e) {
    var currentText = $(e).text();
    if (currentText == "more" ) {
      $(e).text('less');
      $(e).parents('.panel-body').children('.more-info').slideDown();
    } else {
      $(e).text('more');
      $(e).parents('.panel-body').children('.more-info').slideUp();
    }
  };

  ko.applyBindings(new ProgramWidgetsViewModel());

  ko.bindingHandlers.formatCurrency = {
    update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        var value = ko.unwrap(valueAccessor());
        console.log('testing');
        $(element).text(accounting.formatMoney(value, {precision:0}));
    }
  };

  ko.bindingHandlers.formatCurrencyPrecise = {
    update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        var value = ko.unwrap(valueAccessor());
        $(element).text(accounting.formatMoney(value, {precision:2}));
    }
  };

});


function ProgramWidgetsViewModel() {
  var self = this;
  self.widgets = ko.observableArray([]);
  self.programs = ko.observableArray([]);
  self.displayAlert = ko.observable(false);
  self.alertMessage = ko.observable();
  
  //Program Ids Hardcoded to be displayed as Widgets
  widgetIds = [100,101,102];

  //Init Widget Charts using D3.js
  var chartMargin = {top: 0, right: 0, bottom: 16, left: 0}
  var chartWidth = $('.graph-wrapper').width() - 30;
  var chartHeight = 100 - chartMargin.top - chartMargin.bottom;
  var chartY = d3.scaleLinear().range([chartHeight,0]);
  var allCharts = d3.selectAll(".chart")
                      .attr("width",chartWidth + chartMargin.left + chartMargin.right)
                      .attr("height",chartHeight + chartMargin.top + chartMargin.bottom);

  for (var i = 0; i < widgetIds.length; i++) {
    var widget = new Widget(widgetIds[i]);
    self.widgets.push(widget);
  };

  $('#form-new_program').submit(function(e) {
    e.preventDefault();
    //TODO: Ajax Submit Form
    self.displayAlert(true);
    self.alertMessage("Success!");
    $('#form-new_program')[0].reset();
    return false;
  });
  

  $.getJSON("/api/programs", function(data) {
    self.programs(data);

    for (var i = 0; i < data.length; i++) {
      for (var j = 0; j < self.widgets().length; j++) {
        if (self.widgets()[j].ProgramID == data[i].ProgramID) {
          self.widgets()[j].Name(data[i].Name);
          self.widgets()[j].TotalMonthlySales(data[i].TotalMonthlySales);
          var SalesArray = [];
          for (var k = 0; k < data[i].Sales.CurrentYear.length; k++) {
            SalesArray[k] = {
              CurrentYear: data[i].Sales.CurrentYear[k],
              PreviousYear: 0
            }
          }
          for (var k = 0; k < data[i].Sales.PreviousYear.length; k++) {
            SalesArray[k].PreviousYear = data[i].Sales.PreviousYear[k];
          }

          var maxValue = d3.max(data[i].Sales.CurrentYear) > d3.max(data[i].Sales.PreviousYear) ? d3.max(data[i].Sales.CurrentYear) : d3.max(data[i].Sales.PreviousYear);
          chartY.domain([0,maxValue]).range([chartHeight,0]);
          
          var groupWidth = chartWidth / (SalesArray.length - 0.5);
          var barWidth = groupWidth / 4 - 1;
          console.log(barWidth + "," + chartWidth + "," + SalesArray.length);

          var chart = d3.select("#" + self.widgets()[j].WidgetID + " .chart");
          var bar = chart.selectAll("g").data(SalesArray).enter().append("g").attr("transform", function(d, index) { return "translate(" + index * groupWidth + ",0)"; });

          bar.append("rect")
                .attr("y", function(d) {return chartY(d.PreviousYear); })
                .attr("height", function(d) {return chartHeight - chartY(d.PreviousYear); })
                .attr("width", barWidth);

          bar.append("rect")
                .attr("y", function(d) {return chartY(d.CurrentYear); })
                .attr("height", function(d) {return chartHeight - chartY(d.CurrentYear); })
                .attr("width", barWidth)
                .attr("transform", function(d, index) { return "translate(" + (barWidth + 1) + ",0)"; });

          bar.append("text")
                .attr("y", function(d) { return chartHeight + 3;})
                .attr("dy", ".75em")
                .text(function(d, index) {return getMonth(index);});

          self.widgets()[j].Sales(SalesArray);
          break;
        } 
      };
    };
  });

  $.getJSON("/api/pricing", function(data) {
    var allPricing = {};
    for (var i = 0; i < data.length; i++) {
      for (var j = 0; j < self.widgets().length; j++) {
        if (self.widgets()[j].ProgramID == data[i].ProgramID) {
          var pricingOption = new PricingOption(data[i]);
          self.widgets()[j].PricingData.push(pricingOption);
          break;
        }
      }
    }
  });

};

function Widget(ProgramID) {
  var self = this;
  self.ProgramID = ProgramID;
  self.WidgetID = "Widget-" + ProgramID;
  self.Name = ko.observable("");
  self.TotalMonthlySales = ko.observable();
  self.TotalMonthlySalesFormatted = ko.computed(function() {
    return self.TotalMonthlySales() ? accounting.formatMoney(self.TotalMonthlySales(), {precision:0}) : "";
  });
  self.Sales = ko.observableArray([]);
  self.PricingData = ko.observableArray([]);
}

function PricingOption(PricingOptionData) {
  var self = this;
  self.PricingOptionID = PricingOptionData.PricingOptionID;
  self.ProgramID = PricingOptionData.ProgramID;
  self.Name = ko.observable(PricingOptionData.Name);
  self.Sales = ko.observable(PricingOptionData.Sales);
  self.SalesFormatted = ko.computed(function() {
    return self.Sales() ? accounting.formatMoney(self.Sales(), {precision:0}) : "";
  });
}

function getMonth(index) {
  switch(index) {
    case 0:
      return "Jan";
      break;
    case 1:
      return "Feb";
      break;
    case 2:
      return "Mar";
      break;
    case 3:
      return "Apr";
      break;
    case 4:
      return "May";
      break;
    case 5:
      return "Jun";
      break;
    case 6:
      return "Jul";
      break;
    case 7:
      return "Aug";
      break;
    case 8:
      return "Sep";
      break;
    case 9:
      return "Oct";
      break;
    case 10:
      return "Nov";
      break;
    case 11:
      return "Dec";
      break;
    default:
      return "";
      break;
  }
}







