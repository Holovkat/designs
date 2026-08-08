// Generated from okf-core-1.0.schema.json by generate-validator.mjs.
// Runtime dependency-free; regenerate only through the reviewed schema workflow.
"use strict";
export const validate = validate20;
export default validate20;
const schema31 = {"$schema":"https://json-schema.org/draft/2020-12/schema","title":"OKF Core Application Profile 1.0","description":"Strict frontmatter contract for newly authored or materially updated OKF records. Historical records are evaluated in compatibility mode by the fixture runner and are never rewritten by this schema.","type":"object","required":["type","title","description","tags","timestamp"],"properties":{"type":{"type":"string","enum":["Architecture","Component","Domain","Decision","Process","Deprecation","State","Inbox"]},"title":{"type":"string","minLength":1,"pattern":"^[^\\r\\n]+$"},"description":{"type":"string","minLength":1,"pattern":"^[^\\r\\n]+$"},"resource":{"type":"string","minLength":1},"tags":{"type":"array","minItems":1,"uniqueItems":true,"items":{"type":"string","pattern":"^[a-z0-9]+([./-][a-z0-9]+)*$"}},"timestamp":{"type":"string","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"},"status":{"type":"string","enum":["active","deprecated","in-progress","blocked"]},"issue_refs":{"$ref":"#/$defs/positiveIntegerSet"},"epic_refs":{"$ref":"#/$defs/positiveIntegerSet"},"id":{"$ref":"#/$defs/conceptId"},"depends_on":{"$ref":"#/$defs/conceptIdSet"},"implements":{"$ref":"#/$defs/conceptIdSet"},"supersedes":{"$ref":"#/$defs/conceptIdSet"},"derived_from":{"$ref":"#/$defs/conceptIdSet"},"contradicts":{"$ref":"#/$defs/conceptIdSet"},"blocked_by":{"$ref":"#/$defs/conceptIdSet"},"decision_status":{"type":"string","minLength":1},"deprecated_reason":{"type":"string","minLength":1},"deprecated_date":{"type":"string","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"},"capture_tier":{"type":"string","enum":["commit","session"]},"commit_sha":{"oneOf":[{"$ref":"#/$defs/fullGitObjectId"},{"type":"array","minItems":1,"uniqueItems":true,"items":{"$ref":"#/$defs/fullGitObjectId"}}]},"branch":{"type":"string","minLength":1},"session_id":{"$ref":"#/$defs/uuid"},"rationale_missing":{"type":"boolean"},"impact_missing":{"type":"boolean"},"assertion_state":{"type":"string","enum":["verified","inferred","proposed","historical","stale"]},"generated_at":{"type":"string","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"},"generated_by":{"type":"string","minLength":1},"source_authority":{"type":"string","enum":["repository-git","repository-contract","repository-source","operator-approval","tracker-record","external-primary","reported-secondary"]},"evidence_refs":{"type":"array","minItems":1,"uniqueItems":true,"items":{"type":"string","minLength":1}},"verified_at":{"type":"string","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"},"verification_method":{"type":"string","minLength":1},"validity_basis":{"type":"string","minLength":1},"valid_from":{"type":"string","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"},"valid_until":{"type":"string","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"},"stale_reason":{"type":"string","minLength":1},"source_repository":{"type":"string","minLength":1},"approval_required":{"type":"boolean"},"approval_ref":{"type":"string","minLength":1}},"allOf":[{"if":{"properties":{"type":{"const":"Inbox"}},"required":["type"]},"then":{"required":["capture_tier","generated_at","generated_by"],"not":{"anyOf":[{"required":["id"]},{"required":["depends_on"]},{"required":["implements"]},{"required":["supersedes"]},{"required":["derived_from"]},{"required":["contradicts"]},{"required":["blocked_by"]}]}},"else":{"required":["status"]}},{"if":{"properties":{"type":{"const":"Deprecation"}},"required":["type"]},"then":{"required":["deprecated_reason","deprecated_date"],"properties":{"status":{"const":"deprecated"}}}},{"if":{"properties":{"status":{"const":"deprecated"}},"required":["status"]},"then":{"properties":{"type":{"const":"Deprecation"}}}},{"if":{"properties":{"capture_tier":{"const":"commit"}},"required":["capture_tier"]},"then":{"properties":{"type":{"const":"Inbox"},"commit_sha":{"$ref":"#/$defs/fullGitObjectId"}},"required":["branch","commit_sha"],"not":{"required":["session_id"]}}},{"if":{"properties":{"capture_tier":{"const":"session"}},"required":["capture_tier"]},"then":{"properties":{"type":{"const":"Inbox"},"commit_sha":{"type":"array","minItems":1,"uniqueItems":true,"items":{"$ref":"#/$defs/fullGitObjectId"}}},"required":["branch","commit_sha","session_id"]}},{"if":{"anyOf":[{"required":["depends_on"]},{"required":["implements"]},{"required":["supersedes"]},{"required":["derived_from"]},{"required":["contradicts"]},{"required":["blocked_by"]}]},"then":{"required":["id"]}},{"if":{"properties":{"assertion_state":{"const":"verified"}},"required":["assertion_state"]},"then":{"required":["generated_at","generated_by","source_authority","evidence_refs","verified_at","verification_method","validity_basis"]}},{"if":{"properties":{"assertion_state":{"const":"inferred"}},"required":["assertion_state"]},"then":{"required":["evidence_refs"]}},{"if":{"properties":{"assertion_state":{"const":"stale"}},"required":["assertion_state"]},"then":{"required":["stale_reason"]}},{"if":{"required":["generated_at"]},"then":{"required":["generated_by"]}},{"if":{"required":["valid_until"]},"then":{"required":["valid_from"]}}],"additionalProperties":true,"$defs":{"positiveIntegerSet":{"type":"array","uniqueItems":true,"items":{"type":"integer","minimum":1}},"uuid":{"type":"string","pattern":"^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},"conceptId":{"type":"string","pattern":"^okf-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},"conceptIdSet":{"type":"array","uniqueItems":true,"items":{"$ref":"#/$defs/conceptId"}},"fullGitObjectId":{"type":"string","pattern":"^(?:[0-9a-f]{40}|[0-9a-f]{64})$"}}};
const schema32 = {"type":"string","pattern":"^(?:[0-9a-f]{40}|[0-9a-f]{64})$"};
const schema34 = {"type":"array","uniqueItems":true,"items":{"type":"integer","minimum":1}};
const schema36 = {"type":"string","pattern":"^okf-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"};
const schema41 = {"type":"string","pattern":"^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"};
const pattern4 = new RegExp("^(?:[0-9a-f]{40}|[0-9a-f]{64})$", "u");
const pattern6 = new RegExp("^[^\\r\\n]+$", "u");
const pattern8 = new RegExp("^[a-z0-9]+([./-][a-z0-9]+)*$", "u");
const pattern9 = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$", "u");
const pattern10 = new RegExp("^okf-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$", "u");
const pattern12 = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}$", "u");
const pattern15 = new RegExp("^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$", "u");
const func0 = function deepEqual(left, right) {
  if (left === right) return true;
  if (!left || !right || typeof left !== "object" || typeof right !== "object") return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every((key) => Object.prototype.hasOwnProperty.call(right, key) && deepEqual(left[key], right[key]));
};
const func2 = function ucs2length(value) {
  let length = 0;
  for (let index = 0; index < value.length; index += 1) {
    length += 1;
    const first = value.charCodeAt(index);
    if (first >= 0xd800 && first <= 0xdbff && index + 1 < value.length) {
      const second = value.charCodeAt(index + 1);
      if ((second & 0xfc00) === 0xdc00) index += 1;
    }
  }
  return length;
};
const schema37 = {"type":"array","uniqueItems":true,"items":{"$ref":"#/$defs/conceptId"}};

function validate21(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate21.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(Array.isArray(data)){
const len0 = data.length;
for(let i0=0; i0<len0; i0++){
let data0 = data[i0];
if(typeof data0 === "string"){
if(!pattern10.test(data0)){
const err0 = {instancePath:instancePath+"/" + i0,schemaPath:"#/$defs/conceptId/pattern",keyword:"pattern",params:{pattern: "^okf-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^okf-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
else {
const err1 = {instancePath:instancePath+"/" + i0,schemaPath:"#/$defs/conceptId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
let i1 = data.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data[i1], data[j0])){
const err2 = {instancePath,schemaPath:"#/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err3 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
validate21.errors = vErrors;
return errors === 0;
}
validate21.evaluated = {"items":true,"dynamicProps":false,"dynamicItems":false};


function validate20(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate20.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const _errs2 = errors;
let valid1 = true;
const _errs3 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((data.type === undefined) && (missing0 = "type")){
const err0 = {};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
else {
if(data.type !== undefined){
if("Inbox" !== data.type){
const err1 = {};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
}
}
var _valid0 = _errs3 === errors;
errors = _errs2;
if(vErrors !== null){
if(_errs2){
vErrors.length = _errs2;
}
else {
vErrors = null;
}
}
let ifClause0;
if(_valid0){
const _errs5 = errors;
const _errs6 = errors;
const _errs7 = errors;
const _errs8 = errors;
let valid4 = false;
const _errs9 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing1;
if((data.id === undefined) && (missing1 = "id")){
const err2 = {};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
var _valid1 = _errs9 === errors;
valid4 = valid4 || _valid1;
const _errs10 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing2;
if((data.depends_on === undefined) && (missing2 = "depends_on")){
const err3 = {};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
var _valid1 = _errs10 === errors;
valid4 = valid4 || _valid1;
const _errs11 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing3;
if((data.implements === undefined) && (missing3 = "implements")){
const err4 = {};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
var _valid1 = _errs11 === errors;
valid4 = valid4 || _valid1;
const _errs12 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing4;
if((data.supersedes === undefined) && (missing4 = "supersedes")){
const err5 = {};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
var _valid1 = _errs12 === errors;
valid4 = valid4 || _valid1;
const _errs13 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing5;
if((data.derived_from === undefined) && (missing5 = "derived_from")){
const err6 = {};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
var _valid1 = _errs13 === errors;
valid4 = valid4 || _valid1;
const _errs14 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing6;
if((data.contradicts === undefined) && (missing6 = "contradicts")){
const err7 = {};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
var _valid1 = _errs14 === errors;
valid4 = valid4 || _valid1;
const _errs15 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing7;
if((data.blocked_by === undefined) && (missing7 = "blocked_by")){
const err8 = {};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
var _valid1 = _errs15 === errors;
valid4 = valid4 || _valid1;
if(!valid4){
const err9 = {};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
else {
errors = _errs8;
if(vErrors !== null){
if(_errs8){
vErrors.length = _errs8;
}
else {
vErrors = null;
}
}
}
var valid3 = _errs7 === errors;
if(valid3){
const err10 = {instancePath,schemaPath:"#/allOf/0/then/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
else {
errors = _errs6;
if(vErrors !== null){
if(_errs6){
vErrors.length = _errs6;
}
else {
vErrors = null;
}
}
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.capture_tier === undefined){
const err11 = {instancePath,schemaPath:"#/allOf/0/then/required",keyword:"required",params:{missingProperty: "capture_tier"},message:"must have required property '"+"capture_tier"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.generated_at === undefined){
const err12 = {instancePath,schemaPath:"#/allOf/0/then/required",keyword:"required",params:{missingProperty: "generated_at"},message:"must have required property '"+"generated_at"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data.generated_by === undefined){
const err13 = {instancePath,schemaPath:"#/allOf/0/then/required",keyword:"required",params:{missingProperty: "generated_by"},message:"must have required property '"+"generated_by"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
var _valid0 = _errs5 === errors;
valid1 = _valid0;
ifClause0 = "then";
}
else {
const _errs16 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.status === undefined){
const err14 = {instancePath,schemaPath:"#/allOf/0/else/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
var _valid0 = _errs16 === errors;
valid1 = _valid0;
ifClause0 = "else";
}
if(!valid1){
const err15 = {instancePath,schemaPath:"#/allOf/0/if",keyword:"if",params:{failingKeyword: ifClause0},message:"must match \""+ifClause0+"\" schema"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
const _errs18 = errors;
let valid5 = true;
const _errs19 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing8;
if((data.type === undefined) && (missing8 = "type")){
const err16 = {};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
else {
if(data.type !== undefined){
if("Deprecation" !== data.type){
const err17 = {};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
}
}
var _valid2 = _errs19 === errors;
errors = _errs18;
if(vErrors !== null){
if(_errs18){
vErrors.length = _errs18;
}
else {
vErrors = null;
}
}
if(_valid2){
const _errs21 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.deprecated_reason === undefined){
const err18 = {instancePath,schemaPath:"#/allOf/1/then/required",keyword:"required",params:{missingProperty: "deprecated_reason"},message:"must have required property '"+"deprecated_reason"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(data.deprecated_date === undefined){
const err19 = {instancePath,schemaPath:"#/allOf/1/then/required",keyword:"required",params:{missingProperty: "deprecated_date"},message:"must have required property '"+"deprecated_date"+"'"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data.status !== undefined){
if("deprecated" !== data.status){
const err20 = {instancePath:instancePath+"/status",schemaPath:"#/allOf/1/then/properties/status/const",keyword:"const",params:{allowedValue: "deprecated"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
}
var _valid2 = _errs21 === errors;
valid5 = _valid2;
if(valid5){
var props0 = {};
props0.status = true;
props0.type = true;
}
}
if(!valid5){
const err21 = {instancePath,schemaPath:"#/allOf/1/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(props0 !== true){
props0 = props0 || {};
props0.type = true;
}
const _errs24 = errors;
let valid8 = true;
const _errs25 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing9;
if((data.status === undefined) && (missing9 = "status")){
const err22 = {};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
else {
if(data.status !== undefined){
if("deprecated" !== data.status){
const err23 = {};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
}
}
var _valid3 = _errs25 === errors;
errors = _errs24;
if(vErrors !== null){
if(_errs24){
vErrors.length = _errs24;
}
else {
vErrors = null;
}
}
if(_valid3){
const _errs27 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type !== undefined){
if("Deprecation" !== data.type){
const err24 = {instancePath:instancePath+"/type",schemaPath:"#/allOf/2/then/properties/type/const",keyword:"const",params:{allowedValue: "Deprecation"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
}
var _valid3 = _errs27 === errors;
valid8 = _valid3;
if(valid8){
var props1 = {};
props1.type = true;
props1.status = true;
}
}
if(!valid8){
const err25 = {instancePath,schemaPath:"#/allOf/2/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(props0 !== true && props1 !== undefined){
if(props1 === true){
props0 = true;
}
else {
props0 = props0 || {};
Object.assign(props0, props1);
}
}
const _errs30 = errors;
let valid11 = true;
const _errs31 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing10;
if((data.capture_tier === undefined) && (missing10 = "capture_tier")){
const err26 = {};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
else {
if(data.capture_tier !== undefined){
if("commit" !== data.capture_tier){
const err27 = {};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
}
}
var _valid4 = _errs31 === errors;
errors = _errs30;
if(vErrors !== null){
if(_errs30){
vErrors.length = _errs30;
}
else {
vErrors = null;
}
}
if(_valid4){
const _errs33 = errors;
const _errs34 = errors;
const _errs35 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing11;
if((data.session_id === undefined) && (missing11 = "session_id")){
const err28 = {};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
var valid13 = _errs35 === errors;
if(valid13){
const err29 = {instancePath,schemaPath:"#/allOf/3/then/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
else {
errors = _errs34;
if(vErrors !== null){
if(_errs34){
vErrors.length = _errs34;
}
else {
vErrors = null;
}
}
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.branch === undefined){
const err30 = {instancePath,schemaPath:"#/allOf/3/then/required",keyword:"required",params:{missingProperty: "branch"},message:"must have required property '"+"branch"+"'"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if(data.commit_sha === undefined){
const err31 = {instancePath,schemaPath:"#/allOf/3/then/required",keyword:"required",params:{missingProperty: "commit_sha"},message:"must have required property '"+"commit_sha"+"'"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if(data.type !== undefined){
if("Inbox" !== data.type){
const err32 = {instancePath:instancePath+"/type",schemaPath:"#/allOf/3/then/properties/type/const",keyword:"const",params:{allowedValue: "Inbox"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data.commit_sha !== undefined){
let data7 = data.commit_sha;
if(typeof data7 === "string"){
if(!pattern4.test(data7)){
const err33 = {instancePath:instancePath+"/commit_sha",schemaPath:"#/$defs/fullGitObjectId/pattern",keyword:"pattern",params:{pattern: "^(?:[0-9a-f]{40}|[0-9a-f]{64})$"},message:"must match pattern \""+"^(?:[0-9a-f]{40}|[0-9a-f]{64})$"+"\""};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
else {
const err34 = {instancePath:instancePath+"/commit_sha",schemaPath:"#/$defs/fullGitObjectId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
}
var _valid4 = _errs33 === errors;
valid11 = _valid4;
if(valid11){
var props2 = {};
props2.type = true;
props2.commit_sha = true;
props2.capture_tier = true;
}
}
if(!valid11){
const err35 = {instancePath,schemaPath:"#/allOf/3/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if(props0 !== true && props2 !== undefined){
if(props2 === true){
props0 = true;
}
else {
props0 = props0 || {};
Object.assign(props0, props2);
}
}
const _errs41 = errors;
let valid16 = true;
const _errs42 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing12;
if((data.capture_tier === undefined) && (missing12 = "capture_tier")){
const err36 = {};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
else {
if(data.capture_tier !== undefined){
if("session" !== data.capture_tier){
const err37 = {};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
}
}
var _valid5 = _errs42 === errors;
errors = _errs41;
if(vErrors !== null){
if(_errs41){
vErrors.length = _errs41;
}
else {
vErrors = null;
}
}
if(_valid5){
const _errs44 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.branch === undefined){
const err38 = {instancePath,schemaPath:"#/allOf/4/then/required",keyword:"required",params:{missingProperty: "branch"},message:"must have required property '"+"branch"+"'"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(data.commit_sha === undefined){
const err39 = {instancePath,schemaPath:"#/allOf/4/then/required",keyword:"required",params:{missingProperty: "commit_sha"},message:"must have required property '"+"commit_sha"+"'"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(data.session_id === undefined){
const err40 = {instancePath,schemaPath:"#/allOf/4/then/required",keyword:"required",params:{missingProperty: "session_id"},message:"must have required property '"+"session_id"+"'"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(data.type !== undefined){
if("Inbox" !== data.type){
const err41 = {instancePath:instancePath+"/type",schemaPath:"#/allOf/4/then/properties/type/const",keyword:"const",params:{allowedValue: "Inbox"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
if(data.commit_sha !== undefined){
let data10 = data.commit_sha;
if(Array.isArray(data10)){
if(data10.length < 1){
const err42 = {instancePath:instancePath+"/commit_sha",schemaPath:"#/allOf/4/then/properties/commit_sha/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
const len0 = data10.length;
for(let i0=0; i0<len0; i0++){
let data11 = data10[i0];
if(typeof data11 === "string"){
if(!pattern4.test(data11)){
const err43 = {instancePath:instancePath+"/commit_sha/" + i0,schemaPath:"#/$defs/fullGitObjectId/pattern",keyword:"pattern",params:{pattern: "^(?:[0-9a-f]{40}|[0-9a-f]{64})$"},message:"must match pattern \""+"^(?:[0-9a-f]{40}|[0-9a-f]{64})$"+"\""};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
else {
const err44 = {instancePath:instancePath+"/commit_sha/" + i0,schemaPath:"#/$defs/fullGitObjectId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
let i1 = data10.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data10[i1], data10[j0])){
const err45 = {instancePath:instancePath+"/commit_sha",schemaPath:"#/allOf/4/then/properties/commit_sha/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err46 = {instancePath:instancePath+"/commit_sha",schemaPath:"#/allOf/4/then/properties/commit_sha/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
}
var _valid5 = _errs44 === errors;
valid16 = _valid5;
if(valid16){
var props3 = {};
props3.type = true;
props3.commit_sha = true;
props3.capture_tier = true;
}
}
if(!valid16){
const err47 = {instancePath,schemaPath:"#/allOf/4/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if(props0 !== true && props3 !== undefined){
if(props3 === true){
props0 = true;
}
else {
props0 = props0 || {};
Object.assign(props0, props3);
}
}
const _errs52 = errors;
let valid23 = true;
const _errs53 = errors;
const _errs54 = errors;
let valid24 = false;
const _errs55 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing13;
if((data.depends_on === undefined) && (missing13 = "depends_on")){
const err48 = {};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
}
var _valid7 = _errs55 === errors;
valid24 = valid24 || _valid7;
const _errs56 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing14;
if((data.implements === undefined) && (missing14 = "implements")){
const err49 = {};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
var _valid7 = _errs56 === errors;
valid24 = valid24 || _valid7;
const _errs57 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing15;
if((data.supersedes === undefined) && (missing15 = "supersedes")){
const err50 = {};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
}
var _valid7 = _errs57 === errors;
valid24 = valid24 || _valid7;
const _errs58 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing16;
if((data.derived_from === undefined) && (missing16 = "derived_from")){
const err51 = {};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
var _valid7 = _errs58 === errors;
valid24 = valid24 || _valid7;
const _errs59 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing17;
if((data.contradicts === undefined) && (missing17 = "contradicts")){
const err52 = {};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
var _valid7 = _errs59 === errors;
valid24 = valid24 || _valid7;
const _errs60 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing18;
if((data.blocked_by === undefined) && (missing18 = "blocked_by")){
const err53 = {};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
}
var _valid7 = _errs60 === errors;
valid24 = valid24 || _valid7;
if(!valid24){
const err54 = {};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
else {
errors = _errs54;
if(vErrors !== null){
if(_errs54){
vErrors.length = _errs54;
}
else {
vErrors = null;
}
}
}
var _valid6 = _errs53 === errors;
errors = _errs52;
if(vErrors !== null){
if(_errs52){
vErrors.length = _errs52;
}
else {
vErrors = null;
}
}
if(_valid6){
const _errs61 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.id === undefined){
const err55 = {instancePath,schemaPath:"#/allOf/5/then/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
}
var _valid6 = _errs61 === errors;
valid23 = _valid6;
}
if(!valid23){
const err56 = {instancePath,schemaPath:"#/allOf/5/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
const _errs63 = errors;
let valid25 = true;
const _errs64 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing19;
if((data.assertion_state === undefined) && (missing19 = "assertion_state")){
const err57 = {};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
else {
if(data.assertion_state !== undefined){
if("verified" !== data.assertion_state){
const err58 = {};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
}
}
}
var _valid8 = _errs64 === errors;
errors = _errs63;
if(vErrors !== null){
if(_errs63){
vErrors.length = _errs63;
}
else {
vErrors = null;
}
}
if(_valid8){
const _errs66 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.generated_at === undefined){
const err59 = {instancePath,schemaPath:"#/allOf/6/then/required",keyword:"required",params:{missingProperty: "generated_at"},message:"must have required property '"+"generated_at"+"'"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(data.generated_by === undefined){
const err60 = {instancePath,schemaPath:"#/allOf/6/then/required",keyword:"required",params:{missingProperty: "generated_by"},message:"must have required property '"+"generated_by"+"'"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
if(data.source_authority === undefined){
const err61 = {instancePath,schemaPath:"#/allOf/6/then/required",keyword:"required",params:{missingProperty: "source_authority"},message:"must have required property '"+"source_authority"+"'"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if(data.evidence_refs === undefined){
const err62 = {instancePath,schemaPath:"#/allOf/6/then/required",keyword:"required",params:{missingProperty: "evidence_refs"},message:"must have required property '"+"evidence_refs"+"'"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
if(data.verified_at === undefined){
const err63 = {instancePath,schemaPath:"#/allOf/6/then/required",keyword:"required",params:{missingProperty: "verified_at"},message:"must have required property '"+"verified_at"+"'"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
if(data.verification_method === undefined){
const err64 = {instancePath,schemaPath:"#/allOf/6/then/required",keyword:"required",params:{missingProperty: "verification_method"},message:"must have required property '"+"verification_method"+"'"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
if(data.validity_basis === undefined){
const err65 = {instancePath,schemaPath:"#/allOf/6/then/required",keyword:"required",params:{missingProperty: "validity_basis"},message:"must have required property '"+"validity_basis"+"'"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
}
var _valid8 = _errs66 === errors;
valid25 = _valid8;
}
if(!valid25){
const err66 = {instancePath,schemaPath:"#/allOf/6/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
if(props0 !== true){
props0 = props0 || {};
props0.assertion_state = true;
}
const _errs68 = errors;
let valid27 = true;
const _errs69 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing20;
if((data.assertion_state === undefined) && (missing20 = "assertion_state")){
const err67 = {};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
else {
if(data.assertion_state !== undefined){
if("inferred" !== data.assertion_state){
const err68 = {};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
}
}
}
var _valid9 = _errs69 === errors;
errors = _errs68;
if(vErrors !== null){
if(_errs68){
vErrors.length = _errs68;
}
else {
vErrors = null;
}
}
if(_valid9){
const _errs71 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.evidence_refs === undefined){
const err69 = {instancePath,schemaPath:"#/allOf/7/then/required",keyword:"required",params:{missingProperty: "evidence_refs"},message:"must have required property '"+"evidence_refs"+"'"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
}
var _valid9 = _errs71 === errors;
valid27 = _valid9;
}
if(!valid27){
const err70 = {instancePath,schemaPath:"#/allOf/7/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
if(props0 !== true){
props0 = props0 || {};
props0.assertion_state = true;
}
const _errs73 = errors;
let valid29 = true;
const _errs74 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing21;
if((data.assertion_state === undefined) && (missing21 = "assertion_state")){
const err71 = {};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
else {
if(data.assertion_state !== undefined){
if("stale" !== data.assertion_state){
const err72 = {};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
}
}
}
var _valid10 = _errs74 === errors;
errors = _errs73;
if(vErrors !== null){
if(_errs73){
vErrors.length = _errs73;
}
else {
vErrors = null;
}
}
if(_valid10){
const _errs76 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.stale_reason === undefined){
const err73 = {instancePath,schemaPath:"#/allOf/8/then/required",keyword:"required",params:{missingProperty: "stale_reason"},message:"must have required property '"+"stale_reason"+"'"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
}
var _valid10 = _errs76 === errors;
valid29 = _valid10;
}
if(!valid29){
const err74 = {instancePath,schemaPath:"#/allOf/8/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
if(props0 !== true){
props0 = props0 || {};
props0.assertion_state = true;
}
const _errs78 = errors;
let valid31 = true;
const _errs79 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing22;
if((data.generated_at === undefined) && (missing22 = "generated_at")){
const err75 = {};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
}
var _valid11 = _errs79 === errors;
errors = _errs78;
if(vErrors !== null){
if(_errs78){
vErrors.length = _errs78;
}
else {
vErrors = null;
}
}
if(_valid11){
const _errs80 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.generated_by === undefined){
const err76 = {instancePath,schemaPath:"#/allOf/9/then/required",keyword:"required",params:{missingProperty: "generated_by"},message:"must have required property '"+"generated_by"+"'"};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
}
var _valid11 = _errs80 === errors;
valid31 = _valid11;
}
if(!valid31){
const err77 = {instancePath,schemaPath:"#/allOf/9/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
const _errs82 = errors;
let valid32 = true;
const _errs83 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing23;
if((data.valid_until === undefined) && (missing23 = "valid_until")){
const err78 = {};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
}
var _valid12 = _errs83 === errors;
errors = _errs82;
if(vErrors !== null){
if(_errs82){
vErrors.length = _errs82;
}
else {
vErrors = null;
}
}
if(_valid12){
const _errs84 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.valid_from === undefined){
const err79 = {instancePath,schemaPath:"#/allOf/10/then/required",keyword:"required",params:{missingProperty: "valid_from"},message:"must have required property '"+"valid_from"+"'"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
}
var _valid12 = _errs84 === errors;
valid32 = _valid12;
}
if(!valid32){
const err80 = {instancePath,schemaPath:"#/allOf/10/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err81 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
if(data.title === undefined){
const err82 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "title"},message:"must have required property '"+"title"+"'"};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
if(data.description === undefined){
const err83 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "description"},message:"must have required property '"+"description"+"'"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
if(data.tags === undefined){
const err84 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "tags"},message:"must have required property '"+"tags"+"'"};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
if(data.timestamp === undefined){
const err85 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "timestamp"},message:"must have required property '"+"timestamp"+"'"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
if(data.type !== undefined){
let data15 = data.type;
if(typeof data15 !== "string"){
const err86 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
if(!((((((((data15 === "Architecture") || (data15 === "Component")) || (data15 === "Domain")) || (data15 === "Decision")) || (data15 === "Process")) || (data15 === "Deprecation")) || (data15 === "State")) || (data15 === "Inbox"))){
const err87 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/enum",keyword:"enum",params:{allowedValues: schema31.properties.type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
}
if(data.title !== undefined){
let data16 = data.title;
if(typeof data16 === "string"){
if(func2(data16) < 1){
const err88 = {instancePath:instancePath+"/title",schemaPath:"#/properties/title/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
if(!pattern6.test(data16)){
const err89 = {instancePath:instancePath+"/title",schemaPath:"#/properties/title/pattern",keyword:"pattern",params:{pattern: "^[^\\r\\n]+$"},message:"must match pattern \""+"^[^\\r\\n]+$"+"\""};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
}
else {
const err90 = {instancePath:instancePath+"/title",schemaPath:"#/properties/title/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
}
if(data.description !== undefined){
let data17 = data.description;
if(typeof data17 === "string"){
if(func2(data17) < 1){
const err91 = {instancePath:instancePath+"/description",schemaPath:"#/properties/description/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
if(!pattern6.test(data17)){
const err92 = {instancePath:instancePath+"/description",schemaPath:"#/properties/description/pattern",keyword:"pattern",params:{pattern: "^[^\\r\\n]+$"},message:"must match pattern \""+"^[^\\r\\n]+$"+"\""};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
}
else {
const err93 = {instancePath:instancePath+"/description",schemaPath:"#/properties/description/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
}
}
if(data.resource !== undefined){
let data18 = data.resource;
if(typeof data18 === "string"){
if(func2(data18) < 1){
const err94 = {instancePath:instancePath+"/resource",schemaPath:"#/properties/resource/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err94];
}
else {
vErrors.push(err94);
}
errors++;
}
}
else {
const err95 = {instancePath:instancePath+"/resource",schemaPath:"#/properties/resource/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
}
if(data.tags !== undefined){
let data19 = data.tags;
if(Array.isArray(data19)){
if(data19.length < 1){
const err96 = {instancePath:instancePath+"/tags",schemaPath:"#/properties/tags/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
const len1 = data19.length;
for(let i2=0; i2<len1; i2++){
let data20 = data19[i2];
if(typeof data20 === "string"){
if(!pattern8.test(data20)){
const err97 = {instancePath:instancePath+"/tags/" + i2,schemaPath:"#/properties/tags/items/pattern",keyword:"pattern",params:{pattern: "^[a-z0-9]+([./-][a-z0-9]+)*$"},message:"must match pattern \""+"^[a-z0-9]+([./-][a-z0-9]+)*$"+"\""};
if(vErrors === null){
vErrors = [err97];
}
else {
vErrors.push(err97);
}
errors++;
}
}
else {
const err98 = {instancePath:instancePath+"/tags/" + i2,schemaPath:"#/properties/tags/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
}
let i3 = data19.length;
let j1;
if(i3 > 1){
const indices0 = {};
for(;i3--;){
let item0 = data19[i3];
if(typeof item0 !== "string"){
continue;
}
if(typeof indices0[item0] == "number"){
j1 = indices0[item0];
const err99 = {instancePath:instancePath+"/tags",schemaPath:"#/properties/tags/uniqueItems",keyword:"uniqueItems",params:{i: i3, j: j1},message:"must NOT have duplicate items (items ## "+j1+" and "+i3+" are identical)"};
if(vErrors === null){
vErrors = [err99];
}
else {
vErrors.push(err99);
}
errors++;
break;
}
indices0[item0] = i3;
}
}
}
else {
const err100 = {instancePath:instancePath+"/tags",schemaPath:"#/properties/tags/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err100];
}
else {
vErrors.push(err100);
}
errors++;
}
}
if(data.timestamp !== undefined){
let data21 = data.timestamp;
if(typeof data21 === "string"){
if(!pattern9.test(data21)){
const err101 = {instancePath:instancePath+"/timestamp",schemaPath:"#/properties/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"+"\""};
if(vErrors === null){
vErrors = [err101];
}
else {
vErrors.push(err101);
}
errors++;
}
}
else {
const err102 = {instancePath:instancePath+"/timestamp",schemaPath:"#/properties/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err102];
}
else {
vErrors.push(err102);
}
errors++;
}
}
if(data.status !== undefined){
let data22 = data.status;
if(typeof data22 !== "string"){
const err103 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
if(!((((data22 === "active") || (data22 === "deprecated")) || (data22 === "in-progress")) || (data22 === "blocked"))){
const err104 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/enum",keyword:"enum",params:{allowedValues: schema31.properties.status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err104];
}
else {
vErrors.push(err104);
}
errors++;
}
}
if(data.issue_refs !== undefined){
let data23 = data.issue_refs;
if(Array.isArray(data23)){
const len2 = data23.length;
for(let i4=0; i4<len2; i4++){
let data24 = data23[i4];
if(!((typeof data24 == "number") && (!(data24 % 1) && !isNaN(data24)))){
const err105 = {instancePath:instancePath+"/issue_refs/" + i4,schemaPath:"#/$defs/positiveIntegerSet/items/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err105];
}
else {
vErrors.push(err105);
}
errors++;
}
if(typeof data24 == "number"){
if(data24 < 1 || isNaN(data24)){
const err106 = {instancePath:instancePath+"/issue_refs/" + i4,schemaPath:"#/$defs/positiveIntegerSet/items/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err106];
}
else {
vErrors.push(err106);
}
errors++;
}
}
}
let i5 = data23.length;
let j2;
if(i5 > 1){
const indices1 = {};
for(;i5--;){
let item1 = data23[i5];
if(!((typeof item1 == "number") && (!(item1 % 1) && !isNaN(item1)))){
continue;
}
if(typeof indices1[item1] == "number"){
j2 = indices1[item1];
const err107 = {instancePath:instancePath+"/issue_refs",schemaPath:"#/$defs/positiveIntegerSet/uniqueItems",keyword:"uniqueItems",params:{i: i5, j: j2},message:"must NOT have duplicate items (items ## "+j2+" and "+i5+" are identical)"};
if(vErrors === null){
vErrors = [err107];
}
else {
vErrors.push(err107);
}
errors++;
break;
}
indices1[item1] = i5;
}
}
}
else {
const err108 = {instancePath:instancePath+"/issue_refs",schemaPath:"#/$defs/positiveIntegerSet/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err108];
}
else {
vErrors.push(err108);
}
errors++;
}
}
if(data.epic_refs !== undefined){
let data25 = data.epic_refs;
if(Array.isArray(data25)){
const len3 = data25.length;
for(let i6=0; i6<len3; i6++){
let data26 = data25[i6];
if(!((typeof data26 == "number") && (!(data26 % 1) && !isNaN(data26)))){
const err109 = {instancePath:instancePath+"/epic_refs/" + i6,schemaPath:"#/$defs/positiveIntegerSet/items/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err109];
}
else {
vErrors.push(err109);
}
errors++;
}
if(typeof data26 == "number"){
if(data26 < 1 || isNaN(data26)){
const err110 = {instancePath:instancePath+"/epic_refs/" + i6,schemaPath:"#/$defs/positiveIntegerSet/items/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err110];
}
else {
vErrors.push(err110);
}
errors++;
}
}
}
let i7 = data25.length;
let j3;
if(i7 > 1){
const indices2 = {};
for(;i7--;){
let item2 = data25[i7];
if(!((typeof item2 == "number") && (!(item2 % 1) && !isNaN(item2)))){
continue;
}
if(typeof indices2[item2] == "number"){
j3 = indices2[item2];
const err111 = {instancePath:instancePath+"/epic_refs",schemaPath:"#/$defs/positiveIntegerSet/uniqueItems",keyword:"uniqueItems",params:{i: i7, j: j3},message:"must NOT have duplicate items (items ## "+j3+" and "+i7+" are identical)"};
if(vErrors === null){
vErrors = [err111];
}
else {
vErrors.push(err111);
}
errors++;
break;
}
indices2[item2] = i7;
}
}
}
else {
const err112 = {instancePath:instancePath+"/epic_refs",schemaPath:"#/$defs/positiveIntegerSet/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err112];
}
else {
vErrors.push(err112);
}
errors++;
}
}
if(data.id !== undefined){
let data27 = data.id;
if(typeof data27 === "string"){
if(!pattern10.test(data27)){
const err113 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/conceptId/pattern",keyword:"pattern",params:{pattern: "^okf-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^okf-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""};
if(vErrors === null){
vErrors = [err113];
}
else {
vErrors.push(err113);
}
errors++;
}
}
else {
const err114 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/conceptId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err114];
}
else {
vErrors.push(err114);
}
errors++;
}
}
if(data.depends_on !== undefined){
if(!(validate21(data.depends_on, {instancePath:instancePath+"/depends_on",parentData:data,parentDataProperty:"depends_on",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate21.errors : vErrors.concat(validate21.errors);
errors = vErrors.length;
}
}
if(data.implements !== undefined){
if(!(validate21(data.implements, {instancePath:instancePath+"/implements",parentData:data,parentDataProperty:"implements",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate21.errors : vErrors.concat(validate21.errors);
errors = vErrors.length;
}
}
if(data.supersedes !== undefined){
if(!(validate21(data.supersedes, {instancePath:instancePath+"/supersedes",parentData:data,parentDataProperty:"supersedes",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate21.errors : vErrors.concat(validate21.errors);
errors = vErrors.length;
}
}
if(data.derived_from !== undefined){
if(!(validate21(data.derived_from, {instancePath:instancePath+"/derived_from",parentData:data,parentDataProperty:"derived_from",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate21.errors : vErrors.concat(validate21.errors);
errors = vErrors.length;
}
}
if(data.contradicts !== undefined){
if(!(validate21(data.contradicts, {instancePath:instancePath+"/contradicts",parentData:data,parentDataProperty:"contradicts",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate21.errors : vErrors.concat(validate21.errors);
errors = vErrors.length;
}
}
if(data.blocked_by !== undefined){
if(!(validate21(data.blocked_by, {instancePath:instancePath+"/blocked_by",parentData:data,parentDataProperty:"blocked_by",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate21.errors : vErrors.concat(validate21.errors);
errors = vErrors.length;
}
}
if(data.decision_status !== undefined){
let data34 = data.decision_status;
if(typeof data34 === "string"){
if(func2(data34) < 1){
const err115 = {instancePath:instancePath+"/decision_status",schemaPath:"#/properties/decision_status/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err115];
}
else {
vErrors.push(err115);
}
errors++;
}
}
else {
const err116 = {instancePath:instancePath+"/decision_status",schemaPath:"#/properties/decision_status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err116];
}
else {
vErrors.push(err116);
}
errors++;
}
}
if(data.deprecated_reason !== undefined){
let data35 = data.deprecated_reason;
if(typeof data35 === "string"){
if(func2(data35) < 1){
const err117 = {instancePath:instancePath+"/deprecated_reason",schemaPath:"#/properties/deprecated_reason/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err117];
}
else {
vErrors.push(err117);
}
errors++;
}
}
else {
const err118 = {instancePath:instancePath+"/deprecated_reason",schemaPath:"#/properties/deprecated_reason/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err118];
}
else {
vErrors.push(err118);
}
errors++;
}
}
if(data.deprecated_date !== undefined){
let data36 = data.deprecated_date;
if(typeof data36 === "string"){
if(!pattern12.test(data36)){
const err119 = {instancePath:instancePath+"/deprecated_date",schemaPath:"#/properties/deprecated_date/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"+"\""};
if(vErrors === null){
vErrors = [err119];
}
else {
vErrors.push(err119);
}
errors++;
}
}
else {
const err120 = {instancePath:instancePath+"/deprecated_date",schemaPath:"#/properties/deprecated_date/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err120];
}
else {
vErrors.push(err120);
}
errors++;
}
}
if(data.capture_tier !== undefined){
let data37 = data.capture_tier;
if(typeof data37 !== "string"){
const err121 = {instancePath:instancePath+"/capture_tier",schemaPath:"#/properties/capture_tier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err121];
}
else {
vErrors.push(err121);
}
errors++;
}
if(!((data37 === "commit") || (data37 === "session"))){
const err122 = {instancePath:instancePath+"/capture_tier",schemaPath:"#/properties/capture_tier/enum",keyword:"enum",params:{allowedValues: schema31.properties.capture_tier.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err122];
}
else {
vErrors.push(err122);
}
errors++;
}
}
if(data.commit_sha !== undefined){
let data38 = data.commit_sha;
const _errs130 = errors;
let valid46 = false;
let passing0 = null;
const _errs131 = errors;
if(typeof data38 === "string"){
if(!pattern4.test(data38)){
const err123 = {instancePath:instancePath+"/commit_sha",schemaPath:"#/$defs/fullGitObjectId/pattern",keyword:"pattern",params:{pattern: "^(?:[0-9a-f]{40}|[0-9a-f]{64})$"},message:"must match pattern \""+"^(?:[0-9a-f]{40}|[0-9a-f]{64})$"+"\""};
if(vErrors === null){
vErrors = [err123];
}
else {
vErrors.push(err123);
}
errors++;
}
}
else {
const err124 = {instancePath:instancePath+"/commit_sha",schemaPath:"#/$defs/fullGitObjectId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err124];
}
else {
vErrors.push(err124);
}
errors++;
}
var _valid13 = _errs131 === errors;
if(_valid13){
valid46 = true;
passing0 = 0;
}
const _errs134 = errors;
if(Array.isArray(data38)){
if(data38.length < 1){
const err125 = {instancePath:instancePath+"/commit_sha",schemaPath:"#/properties/commit_sha/oneOf/1/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err125];
}
else {
vErrors.push(err125);
}
errors++;
}
const len4 = data38.length;
for(let i8=0; i8<len4; i8++){
let data39 = data38[i8];
if(typeof data39 === "string"){
if(!pattern4.test(data39)){
const err126 = {instancePath:instancePath+"/commit_sha/" + i8,schemaPath:"#/$defs/fullGitObjectId/pattern",keyword:"pattern",params:{pattern: "^(?:[0-9a-f]{40}|[0-9a-f]{64})$"},message:"must match pattern \""+"^(?:[0-9a-f]{40}|[0-9a-f]{64})$"+"\""};
if(vErrors === null){
vErrors = [err126];
}
else {
vErrors.push(err126);
}
errors++;
}
}
else {
const err127 = {instancePath:instancePath+"/commit_sha/" + i8,schemaPath:"#/$defs/fullGitObjectId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err127];
}
else {
vErrors.push(err127);
}
errors++;
}
}
let i9 = data38.length;
let j4;
if(i9 > 1){
outer1:
for(;i9--;){
for(j4 = i9; j4--;){
if(func0(data38[i9], data38[j4])){
const err128 = {instancePath:instancePath+"/commit_sha",schemaPath:"#/properties/commit_sha/oneOf/1/uniqueItems",keyword:"uniqueItems",params:{i: i9, j: j4},message:"must NOT have duplicate items (items ## "+j4+" and "+i9+" are identical)"};
if(vErrors === null){
vErrors = [err128];
}
else {
vErrors.push(err128);
}
errors++;
break outer1;
}
}
}
}
}
else {
const err129 = {instancePath:instancePath+"/commit_sha",schemaPath:"#/properties/commit_sha/oneOf/1/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err129];
}
else {
vErrors.push(err129);
}
errors++;
}
var _valid13 = _errs134 === errors;
if(_valid13 && valid46){
valid46 = false;
passing0 = [passing0, 1];
}
else {
if(_valid13){
valid46 = true;
passing0 = 1;
}
}
if(!valid46){
const err130 = {instancePath:instancePath+"/commit_sha",schemaPath:"#/properties/commit_sha/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err130];
}
else {
vErrors.push(err130);
}
errors++;
}
else {
errors = _errs130;
if(vErrors !== null){
if(_errs130){
vErrors.length = _errs130;
}
else {
vErrors = null;
}
}
}
}
if(data.branch !== undefined){
let data40 = data.branch;
if(typeof data40 === "string"){
if(func2(data40) < 1){
const err131 = {instancePath:instancePath+"/branch",schemaPath:"#/properties/branch/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err131];
}
else {
vErrors.push(err131);
}
errors++;
}
}
else {
const err132 = {instancePath:instancePath+"/branch",schemaPath:"#/properties/branch/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err132];
}
else {
vErrors.push(err132);
}
errors++;
}
}
if(data.session_id !== undefined){
let data41 = data.session_id;
if(typeof data41 === "string"){
if(!pattern15.test(data41)){
const err133 = {instancePath:instancePath+"/session_id",schemaPath:"#/$defs/uuid/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""};
if(vErrors === null){
vErrors = [err133];
}
else {
vErrors.push(err133);
}
errors++;
}
}
else {
const err134 = {instancePath:instancePath+"/session_id",schemaPath:"#/$defs/uuid/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err134];
}
else {
vErrors.push(err134);
}
errors++;
}
}
if(data.rationale_missing !== undefined){
if(typeof data.rationale_missing !== "boolean"){
const err135 = {instancePath:instancePath+"/rationale_missing",schemaPath:"#/properties/rationale_missing/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err135];
}
else {
vErrors.push(err135);
}
errors++;
}
}
if(data.impact_missing !== undefined){
if(typeof data.impact_missing !== "boolean"){
const err136 = {instancePath:instancePath+"/impact_missing",schemaPath:"#/properties/impact_missing/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err136];
}
else {
vErrors.push(err136);
}
errors++;
}
}
if(data.assertion_state !== undefined){
let data44 = data.assertion_state;
if(typeof data44 !== "string"){
const err137 = {instancePath:instancePath+"/assertion_state",schemaPath:"#/properties/assertion_state/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err137];
}
else {
vErrors.push(err137);
}
errors++;
}
if(!(((((data44 === "verified") || (data44 === "inferred")) || (data44 === "proposed")) || (data44 === "historical")) || (data44 === "stale"))){
const err138 = {instancePath:instancePath+"/assertion_state",schemaPath:"#/properties/assertion_state/enum",keyword:"enum",params:{allowedValues: schema31.properties.assertion_state.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err138];
}
else {
vErrors.push(err138);
}
errors++;
}
}
if(data.generated_at !== undefined){
let data45 = data.generated_at;
if(typeof data45 === "string"){
if(!pattern9.test(data45)){
const err139 = {instancePath:instancePath+"/generated_at",schemaPath:"#/properties/generated_at/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"+"\""};
if(vErrors === null){
vErrors = [err139];
}
else {
vErrors.push(err139);
}
errors++;
}
}
else {
const err140 = {instancePath:instancePath+"/generated_at",schemaPath:"#/properties/generated_at/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err140];
}
else {
vErrors.push(err140);
}
errors++;
}
}
if(data.generated_by !== undefined){
let data46 = data.generated_by;
if(typeof data46 === "string"){
if(func2(data46) < 1){
const err141 = {instancePath:instancePath+"/generated_by",schemaPath:"#/properties/generated_by/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err141];
}
else {
vErrors.push(err141);
}
errors++;
}
}
else {
const err142 = {instancePath:instancePath+"/generated_by",schemaPath:"#/properties/generated_by/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err142];
}
else {
vErrors.push(err142);
}
errors++;
}
}
if(data.source_authority !== undefined){
let data47 = data.source_authority;
if(typeof data47 !== "string"){
const err143 = {instancePath:instancePath+"/source_authority",schemaPath:"#/properties/source_authority/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err143];
}
else {
vErrors.push(err143);
}
errors++;
}
if(!(((((((data47 === "repository-git") || (data47 === "repository-contract")) || (data47 === "repository-source")) || (data47 === "operator-approval")) || (data47 === "tracker-record")) || (data47 === "external-primary")) || (data47 === "reported-secondary"))){
const err144 = {instancePath:instancePath+"/source_authority",schemaPath:"#/properties/source_authority/enum",keyword:"enum",params:{allowedValues: schema31.properties.source_authority.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err144];
}
else {
vErrors.push(err144);
}
errors++;
}
}
if(data.evidence_refs !== undefined){
let data48 = data.evidence_refs;
if(Array.isArray(data48)){
if(data48.length < 1){
const err145 = {instancePath:instancePath+"/evidence_refs",schemaPath:"#/properties/evidence_refs/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err145];
}
else {
vErrors.push(err145);
}
errors++;
}
const len5 = data48.length;
for(let i10=0; i10<len5; i10++){
let data49 = data48[i10];
if(typeof data49 === "string"){
if(func2(data49) < 1){
const err146 = {instancePath:instancePath+"/evidence_refs/" + i10,schemaPath:"#/properties/evidence_refs/items/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err146];
}
else {
vErrors.push(err146);
}
errors++;
}
}
else {
const err147 = {instancePath:instancePath+"/evidence_refs/" + i10,schemaPath:"#/properties/evidence_refs/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err147];
}
else {
vErrors.push(err147);
}
errors++;
}
}
let i11 = data48.length;
let j5;
if(i11 > 1){
const indices3 = {};
for(;i11--;){
let item3 = data48[i11];
if(typeof item3 !== "string"){
continue;
}
if(typeof indices3[item3] == "number"){
j5 = indices3[item3];
const err148 = {instancePath:instancePath+"/evidence_refs",schemaPath:"#/properties/evidence_refs/uniqueItems",keyword:"uniqueItems",params:{i: i11, j: j5},message:"must NOT have duplicate items (items ## "+j5+" and "+i11+" are identical)"};
if(vErrors === null){
vErrors = [err148];
}
else {
vErrors.push(err148);
}
errors++;
break;
}
indices3[item3] = i11;
}
}
}
else {
const err149 = {instancePath:instancePath+"/evidence_refs",schemaPath:"#/properties/evidence_refs/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err149];
}
else {
vErrors.push(err149);
}
errors++;
}
}
if(data.verified_at !== undefined){
let data50 = data.verified_at;
if(typeof data50 === "string"){
if(!pattern9.test(data50)){
const err150 = {instancePath:instancePath+"/verified_at",schemaPath:"#/properties/verified_at/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"+"\""};
if(vErrors === null){
vErrors = [err150];
}
else {
vErrors.push(err150);
}
errors++;
}
}
else {
const err151 = {instancePath:instancePath+"/verified_at",schemaPath:"#/properties/verified_at/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err151];
}
else {
vErrors.push(err151);
}
errors++;
}
}
if(data.verification_method !== undefined){
let data51 = data.verification_method;
if(typeof data51 === "string"){
if(func2(data51) < 1){
const err152 = {instancePath:instancePath+"/verification_method",schemaPath:"#/properties/verification_method/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err152];
}
else {
vErrors.push(err152);
}
errors++;
}
}
else {
const err153 = {instancePath:instancePath+"/verification_method",schemaPath:"#/properties/verification_method/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err153];
}
else {
vErrors.push(err153);
}
errors++;
}
}
if(data.validity_basis !== undefined){
let data52 = data.validity_basis;
if(typeof data52 === "string"){
if(func2(data52) < 1){
const err154 = {instancePath:instancePath+"/validity_basis",schemaPath:"#/properties/validity_basis/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err154];
}
else {
vErrors.push(err154);
}
errors++;
}
}
else {
const err155 = {instancePath:instancePath+"/validity_basis",schemaPath:"#/properties/validity_basis/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err155];
}
else {
vErrors.push(err155);
}
errors++;
}
}
if(data.valid_from !== undefined){
let data53 = data.valid_from;
if(typeof data53 === "string"){
if(!pattern9.test(data53)){
const err156 = {instancePath:instancePath+"/valid_from",schemaPath:"#/properties/valid_from/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"+"\""};
if(vErrors === null){
vErrors = [err156];
}
else {
vErrors.push(err156);
}
errors++;
}
}
else {
const err157 = {instancePath:instancePath+"/valid_from",schemaPath:"#/properties/valid_from/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err157];
}
else {
vErrors.push(err157);
}
errors++;
}
}
if(data.valid_until !== undefined){
let data54 = data.valid_until;
if(typeof data54 === "string"){
if(!pattern9.test(data54)){
const err158 = {instancePath:instancePath+"/valid_until",schemaPath:"#/properties/valid_until/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"+"\""};
if(vErrors === null){
vErrors = [err158];
}
else {
vErrors.push(err158);
}
errors++;
}
}
else {
const err159 = {instancePath:instancePath+"/valid_until",schemaPath:"#/properties/valid_until/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err159];
}
else {
vErrors.push(err159);
}
errors++;
}
}
if(data.stale_reason !== undefined){
let data55 = data.stale_reason;
if(typeof data55 === "string"){
if(func2(data55) < 1){
const err160 = {instancePath:instancePath+"/stale_reason",schemaPath:"#/properties/stale_reason/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err160];
}
else {
vErrors.push(err160);
}
errors++;
}
}
else {
const err161 = {instancePath:instancePath+"/stale_reason",schemaPath:"#/properties/stale_reason/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err161];
}
else {
vErrors.push(err161);
}
errors++;
}
}
if(data.source_repository !== undefined){
let data56 = data.source_repository;
if(typeof data56 === "string"){
if(func2(data56) < 1){
const err162 = {instancePath:instancePath+"/source_repository",schemaPath:"#/properties/source_repository/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err162];
}
else {
vErrors.push(err162);
}
errors++;
}
}
else {
const err163 = {instancePath:instancePath+"/source_repository",schemaPath:"#/properties/source_repository/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err163];
}
else {
vErrors.push(err163);
}
errors++;
}
}
if(data.approval_required !== undefined){
if(typeof data.approval_required !== "boolean"){
const err164 = {instancePath:instancePath+"/approval_required",schemaPath:"#/properties/approval_required/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err164];
}
else {
vErrors.push(err164);
}
errors++;
}
}
if(data.approval_ref !== undefined){
let data58 = data.approval_ref;
if(typeof data58 === "string"){
if(func2(data58) < 1){
const err165 = {instancePath:instancePath+"/approval_ref",schemaPath:"#/properties/approval_ref/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err165];
}
else {
vErrors.push(err165);
}
errors++;
}
}
else {
const err166 = {instancePath:instancePath+"/approval_ref",schemaPath:"#/properties/approval_ref/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err166];
}
else {
vErrors.push(err166);
}
errors++;
}
}
}
else {
const err167 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err167];
}
else {
vErrors.push(err167);
}
errors++;
}
validate20.errors = vErrors;
return errors === 0;
}
validate20.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};
