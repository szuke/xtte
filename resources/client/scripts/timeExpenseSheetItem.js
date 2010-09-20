include("xtte");

// Define local variables
xtte.timeExpenseSheetItem = new Object;

var _hours              = mywindow.findChild("_hours");
var _total              = mywindow.findChild("_total");	
var _totalLit           = mywindow.findChild("_totalLit");	
var _rate               = mywindow.findChild("_rate");
var _rateLit            = mywindow.findChild("_rateLit");
var _clients            = mywindow.findChild("_clients");
var _employee           = mywindow.findChild("_employee");
var _items              = mywindow.findChild("_items");
var _po		 = mywindow.findChild("_po");
var _project            = mywindow.findChild("_project");
var _task               = mywindow.findChild("_task");
var _linenumber         = mywindow.findChild("_linenumber");
var _sheet              = mywindow.findChild("_sheet");
var _buttonBox          = mywindow.findChild("_buttonBox");
var _weekending         = mywindow.findChild("_weekending");
var _workdate           = mywindow.findChild("_workdate");
var _type               = mywindow.findChild("_type");
var _qtyLabel           = mywindow.findChild("_qtyLabel");
var _billable           = mywindow.findChild("_billable");
var _prepaid            = mywindow.findChild("_prepaid");
var _actual             = mywindow.findChild("_actual");
var _budget             = mywindow.findChild("_budget");
var _actualCost         = mywindow.findChild("_actualCost");
var _budgetCost         = mywindow.findChild("_budgetCost");
var _notes              = mywindow.findChild("_notes");
var _sheetLit 	 = mywindow.findChild("_sheetLit");

var _cancel = _buttonBox.button(QDialogButtonBox.Cancel);
var _prev = _buttonBox.addButton(qsTr("Prev"), QDialogButtonBox.ActionRole);
var _next = _buttonBox.addButton(qsTr("Next"), QDialogButtonBox.ActionRole);

var _sheetnum;
var _linenum;
var _teitemid = -1;
var _headid = -1;
var _taskid = -1;
var _site;
var _mode = xtte.newMode;
var _modified = false;
var _populating = false;

set = function(input)
{
  if("emp_id" in input)
    _employee.setId(input.emp_id);
  
  if("weekending" in input)
    _weekending.date = input.weekending;

  if ("tehead_id" in input)
    _headid = input.tehead_id;

  if ("site" in input)
    _site = input.site;

  if ("teitem_id" in input)
    _teitemid = input.teitem_id;

  if ("mode" in input)
  {
    _mode = input.mode;

    if (input.mode == xtte.newMode)
      xtte.timeExpenseSheetItem.clear();
    else 
    { 
      if (input.mode == xtte.viewMode)
      {
        var shortcut = _buttonBox.button(QDialogButtonBox.Cancel).shortcut;
        _buttonBox.removeButton(_buttonBox.button(QDialogButtonBox.Cancel));
        _buttonBox.removeButton(_buttonBox.button(QDialogButtonBox.Save));
        _buttonBox.addButton(QDialogButtonBox.Close);
        _buttonBox.button(QDialogButtonBox.Close).shortcut = shortcut;
        _weekending.enabled = false;
        _next.enabled = false;
        _prepaid.enabled = false;
        _type.enabled = false;
        _weekending.enabled = false;
        _workdate.enabled = false;
        _hours.enabled = false;
        _rate.enabled = false;
        _items.enabled = false;
        _employee.enabled = false;
        _clients.enabled = false;
        _po.enabled = false;
        _project.enabled = false;
        _task.enabled = false;
        _notes.enabled = false;
        _billable.enabled = false; 
      }
      xtte.timeExpenseSheetItem.populate();
    }
  }
  
  return mainwindow.NoError;
}

xtte.timeExpenseSheetItem.extension = function()
{
  _total.localValue = (_hours.localValue * _rate.localValue)
  _modified = true;
}

xtte.timeExpenseSheetItem.gettask = function()
{
  if (_project.isValid())
  {
    var params = new Object();
    params.prj_id = _project.id();
    params.name = qsTr("Default");

    var qry = toolbox.executeDbQuery("timeexpensesheetitem", "gettask", params);
    if(!xtte.errorCheck(qry))
      return;

    _task.populate(qry);

    if(_taskid > 0)
      _task.setId(_taskid);

    if (!qry.first())
    {
      var msg = qsTr("No task found. A default task will be added");
      toolbox.messageBox("critical", mywindow, qsTr("task"), msg);
      toolbox.executeDbQuery("timeexpensesheetitem","instask",params);

      qry = toolbox.executeDbQuery("timeexpensesheetitem", "gettask", params);
      _task.populate(qry);
    }

    xtte.timeExpenseSheetItem.getPrice();
    xtte.timeExpenseSheetItem.setActualBudget();
  }
}

xtte.timeExpenseSheetItem.modified = function()
{
  _modified = true;
}

xtte.timeExpenseSheetItem.getPrice = function()
{
  if (_populating)
    return;
  else if (_mode == xtte.editMode)
  {
    if (QMessageBox.question(mywindow,
                       qsTr("Upate Rate?"),
                       qsTr("<p>Would you like to update the existing rate?"),
                        QMessageBox.Ok, QMessageBox.Cancel) == QMessageBox.Cancel)
      return;
  }

  var params = new Object();
  params.item_id = _items.id();
  params.task_id = _task.id();
  params.prj_id = _project.id();
  params.cust_id = _clients.id();
  params.emp_id = _employee.id();
  if (_type.code == "T")
    params.time = true;
  
  var qry = toolbox.executeDbQuery("timeexpensesheetitem", "getterate", params);
  
  if (qry.first())
    _rate.setBaseValue(qry.value("rate"));
  else
    xtte.errorCheck(qry);
}

xtte.timeExpenseSheetItem.populate = function()
{
  _modified = false;
 
  // Edit or View mode
  var params = new Object();
  params.teitem_id = _teitemid;

  q = toolbox.executeDbQuery("timeexpensesheetitem","detail", params);
  if (q.first())
  {
    _populating = true; 

    _type.code = q.value("teitem_type");
    _billable.checked = q.value("teitem_billable");
    _prepaid.checked = q.value("teitem_prepaid")
    _weekending.date = (q.value("tehead_weekending"));
    _workdate.date = (q.value("teitem_workdate"));
    _rate.setId(q.value("teitem_curr_id") - 0);
    _rate.localValue = (q.value("teitem_rate"));
    _saverate = q.value("teitem_rate");
    _hours.localValue = (q.value("teitem_qty"));
    _items.setId(q.value("teitem_item_id"));
    _employee.setId(q.value("tehead_emp_id"));
    _clients.setId(q.value("teitem_cust_id"));
    _po.text = (q.value("teitem_po"));
    _project.setId(q.value("teitem_prj_id"));
    _task.setId(q.value("teitem_prjtask_id"));
    _sheet.text = (q.value("tehead_number"));
    _sheetnum = (q.value("tehead_number"));
    _linenumber.text = (q.value("teitem_linenumber"));
    _linenum = (q.value("teitem_linenumber"));
    _notes.plainText = q.value("teitem_notes");

    _rate.localValue = _saverate;
    _total.localValue = (q.value("teitem_total"));

    _next.enabled = (!q.value("ismax"));
    _prev.enabled = (_linenum > 1);

    _populating = false;
    _modified = false;
  }
  else if (!xtte.errorCheck)
    return;
}

xtte.timeExpenseSheetItem.accepted = function()
{
  if (xtte.timeExpenseSheetItem.save())
  {
    if (_mode == xtte.newMode)
      xtte.timeExpenseSheetItem.clear();
    else
      mywindow.close();
  }
}

xtte.timeExpenseSheetItem.save = function()
{
  try
  {
    if (!_clients.isValid())
      throw new Error(qsTr("Customer Required"));

    if (!_workdate.isValid())
      throw new Error(qsTr("Work Date Required"));
    
    if (!_project.isValid())
      throw new Error(qsTr("Project Required"));
 
    if (!_items.isValid())
      throw new Error(qsTr("Item Required"));

    if (_task.id == -1)
      throw new Error(qsTr("Task Required"));
  }
  catch (e)
  {
    QMessageBox.critical(mywindow, qsTr("Processing Error"), e.message);
    return false;
  }

  var params = new Object();
  params.teitem_tehead_id      = _headid;
  params.teitem_linenumber     = _linenum;
  params.teitem_type = _type.code;
  params.teitem_workdate       = _workdate.date;
  params.teitem_cust_id        = _clients.id();
  params.teitem_po             = _po.text;
  params.teitem_item_id        = _items.id();
  params.teitem_qty            = _hours.localValue;
  params.teitem_rate           = _rate.localValue;
  params.teitem_total          = _total.localValue;
  params.teitem_prj_id         = _project.id();
  params.teitem_prjtask_id     = _task.id();
  params.teitem_billable       = _billable.checked;
  params.teitem_prepaid        = _prepaid.checked;
  params.teitem_notes          = _notes.plainText;
  params.teitem_id             = _teitemid;
  params.teitem_curr_id        = _rate.id();

  var query;
  if (_teitemid > 0)
    query = "updteitem";
  else
    query = "insteitem";

  var q = toolbox.executeDbQuery("timeexpensesheetitem", query, params);
  if (q.first())
    _teitemid = q.value("teitem_id");
  else if (!xtte.errorCheck(q))
    return;

  _prev.enabled = true;

  return true;
}


xtte.timeExpenseSheetItem.typeChanged = function()
{
  if (_type.code == "T")
  {
    _qtyLabel.text = "Hours:";
    _billable.visible = true;
    _prepaid.visible = false;
  } 
  else
  {
    _qtyLabel.text = "Qty:";
    _billable.visible = true;
    _prepaid.visible = true;
    _rate.localValue = 0;
  }
  xtte.timeExpenseSheetItem.getPrice();
  xtte.timeExpenseSheetItem.modified();
}

xtte.timeExpenseSheetItem.customerChanged = function()
{
  if (_populating)
    return;

  var params = new Object;
  params.cust_id = _clients.id();

  q = toolbox.executeDbQuery("timeexpensesheetitem", "getcustinfo", params);
  if (q.first())
    _rate.setId(q.value("cust_curr_id") - 0);
  else if (!xtte.errorCheck(q))
    return;

  xtte.timeExpenseSheetItem.getPrice();
}

xtte.timeExpenseSheetItem.projectChanged = function()
{
  //enable and reset the task fields
  if(_project.isValid() && 
     _mode != xtte.viewMode)
  {
    _next.enabled = true;
    _task.enabled = true;
  }
  else
  {
    _next.enabled = false;
    _task.enabled = false;
  }

  xtte.timeExpenseSheetItem.gettask();
  xtte.timeExpenseSheetItem.modified();
  xtte.timeExpenseSheetItem.getPrice();
}


xtte.timeExpenseSheetItem.taskChanged = function()
{  
  var custid = -1;
  var itemid = -1;
  var params = new Object;
  params.prjtask_id = _task.id();

  q = toolbox.executeDbQuery("timeexpensesheetitem", "taskdefaults", params);
  if (q.first())
  {
    custid = q.value("cust_id");
    itemid = q.value("item_id")
  }
  else if (!xtte.errorCheck(q))
    return;

  if (_populating)
  {
    // Disable if customer matches default, otherwise default must have changed
    // so allow for editing so user can decide what to do
    _clients.enabled = !(_clients.isValid() && _clients.id() == custid)
    _items.enabled = !(_items.isValid() && _items.id() == itemid)
  }
  else
  {
    if (custid > 0)
    {
      _clients.setId(custid);
      _clients.enabled = false;
    }
    else
      clients.enabled = true;

    if (itemid > 0)
    {
      _items.setId(itemid);
      _items.enabled = false;
    }
    else
      _items.enabled = true;
  }

  xtte.timeExpenseSheetItem.getPrice();
  xtte.timeExpenseSheetItem.setActualBudget();
  xtte.timeExpenseSheetItem.modified();
}

xtte.timeExpenseSheetItem.setActualBudget = function()
{
  var params = new Object;
  params.prjid = _project.id();
  params.taskid = _task.id();
 
  var q = toolbox.executeDbQuery("timeexpensesheetitem", "taskbudg",params);
  if (q.first())
  {
    _budget.text = q.value("budget_hours");        
    _actual.text = q.value("actual_hours");       
    _budgetCost.text = q.value("budget_cost");        
    _actualCost.text = q.value("actual_cost");        
    
  }
  else 
    xtte.errorCheck(q);
}


xtte.timeExpenseSheetItem.rollupActual = function()
{
  var parms = new Object;
  parms.taskid = _task.id();

  _totalCost = 0;
  _totalhrs = 0;    

  // get the task actuals then add the current
  var q = toolbox.executeDbQuery("timeexpensesheetitem","taskrollup",parms);

  if (q.first())
  {
    if(_type.code == "T")
      _actual.setText(q.value("total_hours"));

    _actualCost.setText(q.value("total_cost"));
  } 
  else
    xtte.errorCheck(q);
}


xtte.timeExpenseSheetItem.prev = function()
{

  if (_modified)
  {
    if (MessageBox.question(mywindow,
                       qsTr("Unsaved Changed"),
                       qsTr("<p>You have made some changes "
                       + "which have not yet been saved!\n" 
                       + "Would you like to save them now?"),
                        QMessageBox.Save, QMessageBox.Cancel) != QMessageBox.Save)
      return;

    xtte.timeExpenseSheetItem.save();
  }

  var params = new Object;
  params.teitem_id = _teitemid;

  var q = toolbox.executeDbQuery("timeexpensesheetitem", "teitemprev", params);

  if (q.first())
  {
    _teitemid = q.value("teitem_id");
    _modified = false;

    if (_mode == xtte.newMode)
      _mode = xtte.editMode;

    _next.enabled = true;
    xtte.timeExpenseSheetItem.populate();
  }
  else
    xtte.errorCheck(q);
}


xtte.timeExpenseSheetItem.next = function()
{
  if (_modified)
  {

    if (toolbox.messageBox("question", mywindow,
                       qsTr("Unsaved Changed"),
                       qsTr("<p>You have made some changes "
                       + "which have not yet been saved!\n" 
                       + "Would you like to save them now?"),
                        QMessageBox.Save, QMessageBox.Cancel) != QMessageBox.Save)
    return;

    xtte.timeExpenseSheetItem.save();
  }

  var params = new Object;
  params.teitem_id = _teitemid;
  var q = toolbox.executeDbQuery("timeexpensesheetitem","teitemnext",params);

  if (q.first())
  {
    _modified = false;
    _teitemid = q.value("teitem_id");
    _prev.enabled = true;
    xtte.timeExpenseSheetItem.populate();
  }
  else if (xtte.errorCheck(q))
    xtte.timeExpenseSheetItem.clear();
}

xtte.timeExpenseSheetItem.clear = function()
{
  var params = new Object();
  params.tehead_id = _headid;

  var q = toolbox.executeDbQuery("te","header",params);

  if (q.first())
  {
    _weekending.date = (q.value("tehead_weekending"));      
    _sheet.text = (q.value("tehead_number"));
    _sheetnum = (q.value("tehead_number"));
    _employee.setId(q.value("tehead_emp_id"));
  }
  else if (!xtte.errorCheck(q))
    return;

  q = toolbox.executeDbQuery("timeexpensesheetitem", "nextlinenum", params);
  if (q.first())
  {
    _linenumber.setText(q.value("linenumber"));
    _linenum = (q.value("linenumber"));
  } 
  else 
    xtte.errorCheck(q);

  _teitemid = -1;
  _prev.enabled = true;
  _type.enabled = true;
  _workdate.clear();
  _workdate.enabled = true;
  _workdate.setFocus();
  _hours.localValue = 0;
  _hours.enabled = true;
  _rate.localValue = 0;
  _rate.enabled = true;
  _items.enabled = true;
  _items.setId(-1);
  _employee.enabled = false;
  _clients.enabled = true;
  _po.clear();
  _po.enabled = true;
  _project.enabled = true;
  _task.enabled = true;
  _notes.clear();
  _notes.enabled = true;

  xtte.timeExpenseSheetItem.getPrice();

  _modified = false;
}


xtte.timeExpenseSheetItem.setSecurity = function()
{
  if (privileges.check("CanViewRates"))
  {
    _rate.visible = true;
    _total.visible = true;
    _rateLit.visible = true;
    _totalLit.visible = true;
  }
  else
  {
    _rate.visible = false;
    _total.visible = false;
    _rateLit.visible = false;
    _totalLit.visible = false;
  }
}

// Initialize default states
_prev.enabled = false;
_next.enabled = false;
_task.enabled = false;
_weekending.enabled = false;
_linenumber.enabled = true;
_employee.enabled = false;
_total.enabled = false;
_total.readonly = true;

_billable.visible = true;
_prepaid.visible = false;

_type.append(1, qsTr("Time"), "T");
_type.append(2, qsTr("Expense"), "E");

_items.setQuery(xtte.itemSql);

// Define connections
_buttonBox.accepted.connect(xtte.timeExpenseSheetItem.accepted);
_buttonBox.rejected.connect(mydialog, "reject");
_prev.clicked.connect(xtte.timeExpenseSheetItem.prev);
_next.clicked.connect(xtte.timeExpenseSheetItem.next);

_task.newID.connect(xtte.timeExpenseSheetItem.taskChanged);
_rate.valueChanged.connect(xtte.timeExpenseSheetItem.extension);
_hours.valueChanged.connect(xtte.timeExpenseSheetItem.extension);
_type.newID.connect(xtte.timeExpenseSheetItem.typeChanged);
_items["newId(int)"].connect(xtte.timeExpenseSheetItem.getPrice);
_clients["newId(int)"].connect(xtte.timeExpenseSheetItem.customerChanged);
_project["newId(int)"].connect(xtte.timeExpenseSheetItem.projectChanged);
_employee.newId.connect(xtte.timeExpenseSheetItem.modified);
_po.textChanged.connect(xtte.timeExpenseSheetItem.modified);
_workdate.newDate.connect(xtte.timeExpenseSheetItem.modified);
_billable.toggled.connect(xtte.timeExpenseSheetItem.modified);
_prepaid.toggled.connect(xtte.timeExpenseSheetItem.modified);
_notes.textChanged.connect(xtte.timeExpenseSheetItem.modified);

xtte.timeExpenseSheetItem.getPrice();
xtte.timeExpenseSheetItem.setSecurity();