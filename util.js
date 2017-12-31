exports.getNextHour = function(date) {
  let newDate=new Date();
  newDate.setHours(date.getHours() + Math.round(date.getMinutes()/60));
  newDate.setMinutes(0);
  return newDate;
}
exports.addMintsToDate = function(date, mintsToAdd) {
  let newDate=new Date();
  newDate.setMinutes(date.getMinutes()+mintsToAdd);
  return newDate;
}