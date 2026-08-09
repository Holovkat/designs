// Generated from okf-knowledge-change-1.schema.json by generate-knowledge-change-validator.mjs.
// Runtime dependency-free; regenerate only through the reviewed schema workflow.
"use strict";
export const validate = validate20;
export default validate20;
const schema31 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://openknowledgeformat.org/schema/okf-knowledge-change-1.schema.json","title":"OKF Knowledge Change Set 1","description":"Strict machine contract for one Tier 2 closeout source: human synthesis, complete capture coverage, exact ordered operations, and evidence-to-claim associations.","type":"object","additionalProperties":false,"required":["schema_version","change_set_id","session","generated","inbox","summary","limits","capture_selection","captures","operations","evidence"],"properties":{"schema_version":{"const":"okf-knowledge-change/1"},"change_set_id":{"$ref":"#/$defs/changeSetId"},"session":{"$ref":"#/$defs/session"},"generated":{"$ref":"#/$defs/generated"},"summary":{"$ref":"#/$defs/summary"},"captures":{"type":"array","minItems":1,"items":{"$ref":"#/$defs/capture"},"maxItems":128},"operations":{"type":"array","items":{"$ref":"#/$defs/operation"},"maxItems":32},"evidence":{"type":"array","items":{"$ref":"#/$defs/evidence"},"maxItems":128},"capture_selection":{"$ref":"#/$defs/captureSelection"},"inbox":{"$ref":"#/$defs/inboxProjection"},"limits":{"type":"object","additionalProperties":false,"required":["max_input_bytes"],"properties":{"max_input_bytes":{"const":16777216}}}},"$defs":{"sha256":{"type":"string","pattern":"^[0-9a-f]{64}$"},"gitObject":{"type":"string","pattern":"^(?:[0-9a-f]{40}|[0-9a-f]{64})$"},"utcTimestamp":{"type":"string","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"},"uuid":{"type":"string","pattern":"^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},"conceptId":{"type":"string","pattern":"^okf-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},"changeSetId":{"type":"string","pattern":"^ks-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},"captureId":{"type":"string","pattern":"^cap-[a-z0-9][a-z0-9._-]{0,79}$"},"operationId":{"type":"string","pattern":"^op-[a-z0-9][a-z0-9._-]{0,79}$"},"evidenceId":{"type":"string","pattern":"^ev-[a-z0-9][a-z0-9._-]{0,79}$"},"claimId":{"type":"string","pattern":"^claim-[a-z0-9][a-z0-9._-]{0,79}$"},"relativePath":{"type":"string","minLength":1,"maxLength":1024,"pattern":"^(?!/)(?![A-Za-z][A-Za-z0-9+.-]*:)(?!.*\\\\)(?!.*[\\u0000-\\u001f\\u007f])(?!.*//)(?!.*(?:^|/)\\.\\.?(?:/|$))(?!.*\\/$)[^\\u0000]+$"},"conceptPath":{"type":"string","pattern":"^knowledge/(?:architecture|components|domain|decisions|process|deprecation|state)/[a-z0-9][a-z0-9.-]*\\.md$"},"nonEmptyText":{"type":"string","minLength":1,"maxLength":2048,"pattern":"^[^\\u0000-\\u001f\\u007f]*\\S[^\\u0000-\\u001f\\u007f]*$"},"stringList":{"type":"array","uniqueItems":true,"items":{"type":"string","minLength":1,"maxLength":2048,"pattern":"^(?=.*\\S)[^\\r\\n]+$"},"maxItems":32},"session":{"type":"object","additionalProperties":false,"required":["session_id","repository","branch","base_revision","head_revision","started_at","closed_at"],"properties":{"session_id":{"$ref":"#/$defs/uuid"},"repository":{"type":"string","minLength":1,"maxLength":256},"branch":{"type":"string","minLength":1,"maxLength":256},"base_revision":{"$ref":"#/$defs/gitObject"},"head_revision":{"$ref":"#/$defs/gitObject"},"started_at":{"$ref":"#/$defs/utcTimestamp"},"closed_at":{"$ref":"#/$defs/utcTimestamp"}}},"generated":{"type":"object","additionalProperties":false,"required":["at","by","mechanism"],"properties":{"at":{"$ref":"#/$defs/utcTimestamp"},"by":{"type":"string","minLength":1,"maxLength":256},"mechanism":{"type":"string","enum":["author-time-agent","human-authored","imported-legacy"]}}},"summary":{"type":"object","additionalProperties":false,"required":["decisions_made","what_was_deprecated","lessons_learned","current_state"],"properties":{"decisions_made":{"$ref":"#/$defs/stringList"},"what_was_deprecated":{"$ref":"#/$defs/stringList"},"lessons_learned":{"$ref":"#/$defs/stringList"},"current_state":{"$ref":"#/$defs/stringList"}}},"sourceIdentity":{"type":"object","additionalProperties":false,"required":["path","sha256","size_bytes","classification","content_access"],"properties":{"path":{"$ref":"#/$defs/relativePath"},"sha256":{"$ref":"#/$defs/sha256"},"size_bytes":{"type":"integer","minimum":0},"classification":{"type":"string","enum":["markdown","text","binary","oversized","malformed","secret-bearing","unknown"]},"content_access":{"type":"string","enum":["reviewed","identity-only"]},"media_type":{"type":"string","minLength":1,"maxLength":256}},"allOf":[{"if":{"properties":{"classification":{"enum":["binary","oversized","malformed","secret-bearing","unknown"]}},"required":["classification"]},"then":{"properties":{"content_access":{"const":"identity-only"}}}}]},"coveredBy":{"oneOf":[{"type":"object","additionalProperties":false,"required":["kind","ref"],"properties":{"kind":{"const":"capture"},"ref":{"$ref":"#/$defs/captureId"}}},{"type":"object","additionalProperties":false,"required":["kind","ref"],"properties":{"kind":{"const":"concept"},"ref":{"$ref":"#/$defs/conceptId"}}},{"type":"object","additionalProperties":false,"required":["kind","ref"],"properties":{"kind":{"const":"operation"},"ref":{"$ref":"#/$defs/operationId"}}}]},"review":{"type":"object","additionalProperties":false,"required":["state","reasons"],"properties":{"state":{"const":"pending"},"reasons":{"type":"array","minItems":1,"items":{"type":"string","minLength":1,"maxLength":512,"pattern":"^[^\\u0000-\\u001f\\u007f]*\\S[^\\u0000-\\u001f\\u007f]*$"},"maxItems":8}}},"disposition":{"oneOf":[{"type":"object","additionalProperties":false,"required":["type","operation_ids"],"properties":{"type":{"const":"create"},"operation_ids":{"type":"array","minItems":1,"uniqueItems":true,"items":{"$ref":"#/$defs/operationId"},"maxItems":32}}},{"type":"object","additionalProperties":false,"required":["type","operation_ids"],"properties":{"type":{"const":"update"},"operation_ids":{"type":"array","minItems":1,"uniqueItems":true,"items":{"$ref":"#/$defs/operationId"},"maxItems":32}}},{"type":"object","additionalProperties":false,"required":["type","operation_ids"],"properties":{"type":{"const":"merge"},"operation_ids":{"type":"array","minItems":1,"uniqueItems":true,"items":{"$ref":"#/$defs/operationId"},"maxItems":32}}},{"type":"object","additionalProperties":false,"required":["type","operation_ids"],"properties":{"type":{"const":"supersede"},"operation_ids":{"type":"array","minItems":1,"uniqueItems":true,"items":{"$ref":"#/$defs/operationId"},"maxItems":32}}},{"type":"object","additionalProperties":false,"required":["type","operation_ids","reason"],"properties":{"type":{"const":"no-durable-change"},"operation_ids":{"type":"array","maxItems":32},"reason":{"$ref":"#/$defs/nonEmptyText"}}},{"type":"object","additionalProperties":false,"required":["type","operation_ids","covered_by"],"properties":{"type":{"const":"duplicate"},"operation_ids":{"type":"array","maxItems":32},"covered_by":{"$ref":"#/$defs/coveredBy"}}},{"type":"object","additionalProperties":false,"required":["type","operation_ids","review"],"properties":{"type":{"const":"review-required"},"operation_ids":{"type":"array","uniqueItems":true,"items":{"$ref":"#/$defs/operationId"},"maxItems":32},"review":{"$ref":"#/$defs/review"}}}]},"capture":{"type":"object","additionalProperties":false,"required":["capture_id","source","disposition"],"properties":{"capture_id":{"$ref":"#/$defs/captureId"},"source":{"$ref":"#/$defs/sourceIdentity"},"disposition":{"$ref":"#/$defs/disposition"}},"allOf":[{"if":{"properties":{"source":{"properties":{"classification":{"enum":["binary","oversized","malformed","secret-bearing","unknown"]}},"required":["classification"]}},"required":["source"]},"then":{"properties":{"disposition":{"properties":{"type":{"const":"review-required"}},"required":["type"]}}}},{"if":{"properties":{"source":{"properties":{"content_access":{"const":"identity-only"}},"required":["content_access"]}},"required":["source"]},"then":{"properties":{"disposition":{"properties":{"type":{"const":"review-required"}},"required":["type"]}}}}]},"target":{"type":"object","additionalProperties":false,"required":["concept_id","path","expected"],"properties":{"concept_id":{"$ref":"#/$defs/conceptId"},"path":{"$ref":"#/$defs/conceptPath"},"expected":{"oneOf":[{"type":"object","additionalProperties":false,"required":["absent"],"properties":{"absent":{"const":true}}},{"type":"object","additionalProperties":false,"required":["sha256"],"properties":{"sha256":{"$ref":"#/$defs/sha256"}}}]}}},"change":{"type":"object","additionalProperties":false,"required":["mode","value","sha256"],"properties":{"mode":{"const":"exact-content"},"value":{"type":"string","minLength":1,"maxLength":65536},"sha256":{"$ref":"#/$defs/sha256"}}},"claim":{"type":"object","additionalProperties":false,"required":["claim_id","statement","assertion_state","evidence_ids"],"properties":{"claim_id":{"$ref":"#/$defs/claimId"},"statement":{"type":"string","minLength":1,"maxLength":2048,"pattern":"^[^\\u0000-\\u001f\\u007f]*\\S[^\\u0000-\\u001f\\u007f]*$"},"assertion_state":{"type":"string","enum":["proposed","inferred","verified"]},"evidence_ids":{"type":"array","uniqueItems":true,"items":{"$ref":"#/$defs/evidenceId"},"maxItems":128}},"allOf":[{"if":{"properties":{"assertion_state":{"const":"verified"}},"required":["assertion_state"]},"then":{"properties":{"evidence_ids":{"minItems":1}}}},{"if":{"properties":{"assertion_state":{"const":"inferred"}},"required":["assertion_state"]},"then":{"properties":{"evidence_ids":{"minItems":1}}}}]},"deprecation":{"type":"object","additionalProperties":false,"required":["replacement_concept_id","superseded_concept_ids","reason"],"properties":{"replacement_concept_id":{"$ref":"#/$defs/conceptId"},"superseded_concept_ids":{"type":"array","minItems":1,"uniqueItems":true,"items":{"$ref":"#/$defs/conceptId"},"maxItems":128},"reason":{"$ref":"#/$defs/nonEmptyText"},"extended_lessons":{"type":"array","items":{"type":"string","minLength":1,"maxLength":1024,"pattern":"^[^\\u0000-\\u001f\\u007f]*\\S[^\\u0000-\\u001f\\u007f]*$"},"maxItems":8}}},"operation":{"type":"object","additionalProperties":false,"required":["operation_id","sequence","kind","capture_ids","depends_on","idempotency_key","target","change","claims"],"properties":{"operation_id":{"$ref":"#/$defs/operationId"},"sequence":{"type":"integer","minimum":1},"kind":{"type":"string","enum":["create","update","merge","supersede"]},"capture_ids":{"type":"array","minItems":1,"uniqueItems":true,"items":{"$ref":"#/$defs/captureId"},"maxItems":128},"depends_on":{"type":"array","uniqueItems":true,"items":{"$ref":"#/$defs/operationId"},"maxItems":32},"idempotency_key":{"$ref":"#/$defs/sha256"},"target":{"$ref":"#/$defs/target"},"change":{"$ref":"#/$defs/change"},"claims":{"type":"array","minItems":1,"items":{"$ref":"#/$defs/claim"},"maxItems":8},"source_concept_ids":{"type":"array","minItems":2,"uniqueItems":true,"items":{"$ref":"#/$defs/conceptId"},"maxItems":128},"deprecation":{"$ref":"#/$defs/deprecation"}},"allOf":[{"if":{"properties":{"kind":{"const":"create"}},"required":["kind"]},"then":{"properties":{"target":{"properties":{"expected":{"required":["absent"]}}}}}},{"if":{"properties":{"kind":{"enum":["update","merge","supersede"]}},"required":["kind"]},"then":{"properties":{"target":{"properties":{"expected":{"required":["sha256"]}}}}}},{"if":{"properties":{"kind":{"const":"merge"}},"required":["kind"]},"then":{"required":["source_concept_ids"],"not":{"required":["deprecation"]}},"else":{"not":{"required":["source_concept_ids"]}}},{"if":{"properties":{"kind":{"const":"supersede"}},"required":["kind"]},"then":{"required":["deprecation"],"not":{"required":["source_concept_ids"]}},"else":{"not":{"required":["deprecation"]}}}]},"evidence":{"type":"object","additionalProperties":false,"required":["evidence_id","kind","locator","sha256","independence","produced_by","produced_at","authority_ref"],"properties":{"evidence_id":{"$ref":"#/$defs/evidenceId"},"kind":{"type":"string","enum":["test","receipt","review","source","commit","operator-approval"]},"locator":{"type":"string","minLength":1,"maxLength":1024},"sha256":{"$ref":"#/$defs/sha256"},"independence":{"type":"string","enum":["author","independent"]},"redacted":{"type":"boolean"},"produced_by":{"type":"string","minLength":1,"maxLength":256},"produced_at":{"$ref":"#/$defs/utcTimestamp"},"authority_ref":{"type":"string","minLength":1,"maxLength":1024}}},"captureSelection":{"type":"object","additionalProperties":false,"required":["selector","manifest_path","manifest_sha256","required_capture_ids"],"properties":{"selector":{"const":"explicit"},"manifest_path":{"$ref":"#/$defs/relativePath"},"manifest_sha256":{"$ref":"#/$defs/sha256"},"required_capture_ids":{"type":"array","minItems":1,"uniqueItems":true,"items":{"$ref":"#/$defs/captureId"},"maxItems":128}}},"inboxProjection":{"type":"object","additionalProperties":false,"required":["title","description","tags","commit_shas","issue_refs","epic_refs"],"properties":{"title":{"type":"string","minLength":1,"maxLength":256,"pattern":"^(?=.*\\S)[^\\r\\n]+$"},"description":{"type":"string","minLength":1,"maxLength":512,"pattern":"^(?=.*\\S)[^\\r\\n]+$"},"tags":{"type":"array","minItems":1,"maxItems":32,"uniqueItems":true,"items":{"type":"string","pattern":"^[a-z0-9]+(?:[./-][a-z0-9]+)*$"}},"commit_shas":{"type":"array","minItems":1,"maxItems":128,"uniqueItems":true,"items":{"$ref":"#/$defs/gitObject"}},"issue_refs":{"type":"array","maxItems":128,"uniqueItems":true,"items":{"type":"integer","minimum":1}},"epic_refs":{"type":"array","maxItems":32,"uniqueItems":true,"items":{"type":"integer","minimum":1}}}}}};
const schema32 = {"type":"string","pattern":"^ks-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"};
const func1 = Object.prototype.hasOwnProperty;
const pattern4 = new RegExp("^ks-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$", "u");
const schema33 = {"type":"object","additionalProperties":false,"required":["session_id","repository","branch","base_revision","head_revision","started_at","closed_at"],"properties":{"session_id":{"$ref":"#/$defs/uuid"},"repository":{"type":"string","minLength":1,"maxLength":256},"branch":{"type":"string","minLength":1,"maxLength":256},"base_revision":{"$ref":"#/$defs/gitObject"},"head_revision":{"$ref":"#/$defs/gitObject"},"started_at":{"$ref":"#/$defs/utcTimestamp"},"closed_at":{"$ref":"#/$defs/utcTimestamp"}}};
const schema34 = {"type":"string","pattern":"^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"};
const schema35 = {"type":"string","pattern":"^(?:[0-9a-f]{40}|[0-9a-f]{64})$"};
const schema37 = {"type":"string","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"};
const pattern5 = new RegExp("^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$", "u");
const pattern6 = new RegExp("^(?:[0-9a-f]{40}|[0-9a-f]{64})$", "u");
const pattern8 = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$", "u");
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
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.session_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "session_id"},message:"must have required property '"+"session_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.repository === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "repository"},message:"must have required property '"+"repository"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.branch === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "branch"},message:"must have required property '"+"branch"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.base_revision === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "base_revision"},message:"must have required property '"+"base_revision"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.head_revision === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "head_revision"},message:"must have required property '"+"head_revision"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.started_at === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "started_at"},message:"must have required property '"+"started_at"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.closed_at === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "closed_at"},message:"must have required property '"+"closed_at"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
for(const key0 in data){
if(!(((((((key0 === "session_id") || (key0 === "repository")) || (key0 === "branch")) || (key0 === "base_revision")) || (key0 === "head_revision")) || (key0 === "started_at")) || (key0 === "closed_at"))){
const err7 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.session_id !== undefined){
let data0 = data.session_id;
if(typeof data0 === "string"){
if(!pattern5.test(data0)){
const err8 = {instancePath:instancePath+"/session_id",schemaPath:"#/$defs/uuid/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
else {
const err9 = {instancePath:instancePath+"/session_id",schemaPath:"#/$defs/uuid/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.repository !== undefined){
let data1 = data.repository;
if(typeof data1 === "string"){
if(func2(data1) > 256){
const err10 = {instancePath:instancePath+"/repository",schemaPath:"#/properties/repository/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(func2(data1) < 1){
const err11 = {instancePath:instancePath+"/repository",schemaPath:"#/properties/repository/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
else {
const err12 = {instancePath:instancePath+"/repository",schemaPath:"#/properties/repository/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.branch !== undefined){
let data2 = data.branch;
if(typeof data2 === "string"){
if(func2(data2) > 256){
const err13 = {instancePath:instancePath+"/branch",schemaPath:"#/properties/branch/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(func2(data2) < 1){
const err14 = {instancePath:instancePath+"/branch",schemaPath:"#/properties/branch/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
else {
const err15 = {instancePath:instancePath+"/branch",schemaPath:"#/properties/branch/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.base_revision !== undefined){
let data3 = data.base_revision;
if(typeof data3 === "string"){
if(!pattern6.test(data3)){
const err16 = {instancePath:instancePath+"/base_revision",schemaPath:"#/$defs/gitObject/pattern",keyword:"pattern",params:{pattern: "^(?:[0-9a-f]{40}|[0-9a-f]{64})$"},message:"must match pattern \""+"^(?:[0-9a-f]{40}|[0-9a-f]{64})$"+"\""};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
else {
const err17 = {instancePath:instancePath+"/base_revision",schemaPath:"#/$defs/gitObject/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.head_revision !== undefined){
let data4 = data.head_revision;
if(typeof data4 === "string"){
if(!pattern6.test(data4)){
const err18 = {instancePath:instancePath+"/head_revision",schemaPath:"#/$defs/gitObject/pattern",keyword:"pattern",params:{pattern: "^(?:[0-9a-f]{40}|[0-9a-f]{64})$"},message:"must match pattern \""+"^(?:[0-9a-f]{40}|[0-9a-f]{64})$"+"\""};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
else {
const err19 = {instancePath:instancePath+"/head_revision",schemaPath:"#/$defs/gitObject/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.started_at !== undefined){
let data5 = data.started_at;
if(typeof data5 === "string"){
if(!pattern8.test(data5)){
const err20 = {instancePath:instancePath+"/started_at",schemaPath:"#/$defs/utcTimestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"+"\""};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
else {
const err21 = {instancePath:instancePath+"/started_at",schemaPath:"#/$defs/utcTimestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.closed_at !== undefined){
let data6 = data.closed_at;
if(typeof data6 === "string"){
if(!pattern8.test(data6)){
const err22 = {instancePath:instancePath+"/closed_at",schemaPath:"#/$defs/utcTimestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"+"\""};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
else {
const err23 = {instancePath:instancePath+"/closed_at",schemaPath:"#/$defs/utcTimestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
else {
const err24 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
validate21.errors = vErrors;
return errors === 0;
}
validate21.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema39 = {"type":"object","additionalProperties":false,"required":["at","by","mechanism"],"properties":{"at":{"$ref":"#/$defs/utcTimestamp"},"by":{"type":"string","minLength":1,"maxLength":256},"mechanism":{"type":"string","enum":["author-time-agent","human-authored","imported-legacy"]}}};

function validate23(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate23.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.at === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "at"},message:"must have required property '"+"at"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.by === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "by"},message:"must have required property '"+"by"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.mechanism === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "mechanism"},message:"must have required property '"+"mechanism"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "at") || (key0 === "by")) || (key0 === "mechanism"))){
const err3 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.at !== undefined){
let data0 = data.at;
if(typeof data0 === "string"){
if(!pattern8.test(data0)){
const err4 = {instancePath:instancePath+"/at",schemaPath:"#/$defs/utcTimestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"+"\""};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
else {
const err5 = {instancePath:instancePath+"/at",schemaPath:"#/$defs/utcTimestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.by !== undefined){
let data1 = data.by;
if(typeof data1 === "string"){
if(func2(data1) > 256){
const err6 = {instancePath:instancePath+"/by",schemaPath:"#/properties/by/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(func2(data1) < 1){
const err7 = {instancePath:instancePath+"/by",schemaPath:"#/properties/by/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
else {
const err8 = {instancePath:instancePath+"/by",schemaPath:"#/properties/by/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.mechanism !== undefined){
let data2 = data.mechanism;
if(typeof data2 !== "string"){
const err9 = {instancePath:instancePath+"/mechanism",schemaPath:"#/properties/mechanism/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(!(((data2 === "author-time-agent") || (data2 === "human-authored")) || (data2 === "imported-legacy"))){
const err10 = {instancePath:instancePath+"/mechanism",schemaPath:"#/properties/mechanism/enum",keyword:"enum",params:{allowedValues: schema39.properties.mechanism.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
}
else {
const err11 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
validate23.errors = vErrors;
return errors === 0;
}
validate23.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema41 = {"type":"object","additionalProperties":false,"required":["decisions_made","what_was_deprecated","lessons_learned","current_state"],"properties":{"decisions_made":{"$ref":"#/$defs/stringList"},"what_was_deprecated":{"$ref":"#/$defs/stringList"},"lessons_learned":{"$ref":"#/$defs/stringList"},"current_state":{"$ref":"#/$defs/stringList"}}};
const schema42 = {"type":"array","uniqueItems":true,"items":{"type":"string","minLength":1,"maxLength":2048,"pattern":"^(?=.*\\S)[^\\r\\n]+$"},"maxItems":32};
const pattern11 = new RegExp("^(?=.*\\S)[^\\r\\n]+$", "u");

function validate25(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate25.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.decisions_made === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "decisions_made"},message:"must have required property '"+"decisions_made"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.what_was_deprecated === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "what_was_deprecated"},message:"must have required property '"+"what_was_deprecated"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.lessons_learned === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "lessons_learned"},message:"must have required property '"+"lessons_learned"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.current_state === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "current_state"},message:"must have required property '"+"current_state"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "decisions_made") || (key0 === "what_was_deprecated")) || (key0 === "lessons_learned")) || (key0 === "current_state"))){
const err4 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.decisions_made !== undefined){
let data0 = data.decisions_made;
if(Array.isArray(data0)){
if(data0.length > 32){
const err5 = {instancePath:instancePath+"/decisions_made",schemaPath:"#/$defs/stringList/maxItems",keyword:"maxItems",params:{limit: 32},message:"must NOT have more than 32 items"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
const len0 = data0.length;
for(let i0=0; i0<len0; i0++){
let data1 = data0[i0];
if(typeof data1 === "string"){
if(func2(data1) > 2048){
const err6 = {instancePath:instancePath+"/decisions_made/" + i0,schemaPath:"#/$defs/stringList/items/maxLength",keyword:"maxLength",params:{limit: 2048},message:"must NOT have more than 2048 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(func2(data1) < 1){
const err7 = {instancePath:instancePath+"/decisions_made/" + i0,schemaPath:"#/$defs/stringList/items/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!pattern11.test(data1)){
const err8 = {instancePath:instancePath+"/decisions_made/" + i0,schemaPath:"#/$defs/stringList/items/pattern",keyword:"pattern",params:{pattern: "^(?=.*\\S)[^\\r\\n]+$"},message:"must match pattern \""+"^(?=.*\\S)[^\\r\\n]+$"+"\""};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
else {
const err9 = {instancePath:instancePath+"/decisions_made/" + i0,schemaPath:"#/$defs/stringList/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
let i1 = data0.length;
let j0;
if(i1 > 1){
const indices0 = {};
for(;i1--;){
let item0 = data0[i1];
if(typeof item0 !== "string"){
continue;
}
if(typeof indices0[item0] == "number"){
j0 = indices0[item0];
const err10 = {instancePath:instancePath+"/decisions_made",schemaPath:"#/$defs/stringList/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
break;
}
indices0[item0] = i1;
}
}
}
else {
const err11 = {instancePath:instancePath+"/decisions_made",schemaPath:"#/$defs/stringList/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.what_was_deprecated !== undefined){
let data2 = data.what_was_deprecated;
if(Array.isArray(data2)){
if(data2.length > 32){
const err12 = {instancePath:instancePath+"/what_was_deprecated",schemaPath:"#/$defs/stringList/maxItems",keyword:"maxItems",params:{limit: 32},message:"must NOT have more than 32 items"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
const len1 = data2.length;
for(let i2=0; i2<len1; i2++){
let data3 = data2[i2];
if(typeof data3 === "string"){
if(func2(data3) > 2048){
const err13 = {instancePath:instancePath+"/what_was_deprecated/" + i2,schemaPath:"#/$defs/stringList/items/maxLength",keyword:"maxLength",params:{limit: 2048},message:"must NOT have more than 2048 characters"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(func2(data3) < 1){
const err14 = {instancePath:instancePath+"/what_was_deprecated/" + i2,schemaPath:"#/$defs/stringList/items/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(!pattern11.test(data3)){
const err15 = {instancePath:instancePath+"/what_was_deprecated/" + i2,schemaPath:"#/$defs/stringList/items/pattern",keyword:"pattern",params:{pattern: "^(?=.*\\S)[^\\r\\n]+$"},message:"must match pattern \""+"^(?=.*\\S)[^\\r\\n]+$"+"\""};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
else {
const err16 = {instancePath:instancePath+"/what_was_deprecated/" + i2,schemaPath:"#/$defs/stringList/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
let i3 = data2.length;
let j1;
if(i3 > 1){
const indices1 = {};
for(;i3--;){
let item1 = data2[i3];
if(typeof item1 !== "string"){
continue;
}
if(typeof indices1[item1] == "number"){
j1 = indices1[item1];
const err17 = {instancePath:instancePath+"/what_was_deprecated",schemaPath:"#/$defs/stringList/uniqueItems",keyword:"uniqueItems",params:{i: i3, j: j1},message:"must NOT have duplicate items (items ## "+j1+" and "+i3+" are identical)"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
break;
}
indices1[item1] = i3;
}
}
}
else {
const err18 = {instancePath:instancePath+"/what_was_deprecated",schemaPath:"#/$defs/stringList/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.lessons_learned !== undefined){
let data4 = data.lessons_learned;
if(Array.isArray(data4)){
if(data4.length > 32){
const err19 = {instancePath:instancePath+"/lessons_learned",schemaPath:"#/$defs/stringList/maxItems",keyword:"maxItems",params:{limit: 32},message:"must NOT have more than 32 items"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
const len2 = data4.length;
for(let i4=0; i4<len2; i4++){
let data5 = data4[i4];
if(typeof data5 === "string"){
if(func2(data5) > 2048){
const err20 = {instancePath:instancePath+"/lessons_learned/" + i4,schemaPath:"#/$defs/stringList/items/maxLength",keyword:"maxLength",params:{limit: 2048},message:"must NOT have more than 2048 characters"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(func2(data5) < 1){
const err21 = {instancePath:instancePath+"/lessons_learned/" + i4,schemaPath:"#/$defs/stringList/items/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(!pattern11.test(data5)){
const err22 = {instancePath:instancePath+"/lessons_learned/" + i4,schemaPath:"#/$defs/stringList/items/pattern",keyword:"pattern",params:{pattern: "^(?=.*\\S)[^\\r\\n]+$"},message:"must match pattern \""+"^(?=.*\\S)[^\\r\\n]+$"+"\""};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
else {
const err23 = {instancePath:instancePath+"/lessons_learned/" + i4,schemaPath:"#/$defs/stringList/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
let i5 = data4.length;
let j2;
if(i5 > 1){
const indices2 = {};
for(;i5--;){
let item2 = data4[i5];
if(typeof item2 !== "string"){
continue;
}
if(typeof indices2[item2] == "number"){
j2 = indices2[item2];
const err24 = {instancePath:instancePath+"/lessons_learned",schemaPath:"#/$defs/stringList/uniqueItems",keyword:"uniqueItems",params:{i: i5, j: j2},message:"must NOT have duplicate items (items ## "+j2+" and "+i5+" are identical)"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
break;
}
indices2[item2] = i5;
}
}
}
else {
const err25 = {instancePath:instancePath+"/lessons_learned",schemaPath:"#/$defs/stringList/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.current_state !== undefined){
let data6 = data.current_state;
if(Array.isArray(data6)){
if(data6.length > 32){
const err26 = {instancePath:instancePath+"/current_state",schemaPath:"#/$defs/stringList/maxItems",keyword:"maxItems",params:{limit: 32},message:"must NOT have more than 32 items"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
const len3 = data6.length;
for(let i6=0; i6<len3; i6++){
let data7 = data6[i6];
if(typeof data7 === "string"){
if(func2(data7) > 2048){
const err27 = {instancePath:instancePath+"/current_state/" + i6,schemaPath:"#/$defs/stringList/items/maxLength",keyword:"maxLength",params:{limit: 2048},message:"must NOT have more than 2048 characters"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(func2(data7) < 1){
const err28 = {instancePath:instancePath+"/current_state/" + i6,schemaPath:"#/$defs/stringList/items/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(!pattern11.test(data7)){
const err29 = {instancePath:instancePath+"/current_state/" + i6,schemaPath:"#/$defs/stringList/items/pattern",keyword:"pattern",params:{pattern: "^(?=.*\\S)[^\\r\\n]+$"},message:"must match pattern \""+"^(?=.*\\S)[^\\r\\n]+$"+"\""};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
else {
const err30 = {instancePath:instancePath+"/current_state/" + i6,schemaPath:"#/$defs/stringList/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
let i7 = data6.length;
let j3;
if(i7 > 1){
const indices3 = {};
for(;i7--;){
let item3 = data6[i7];
if(typeof item3 !== "string"){
continue;
}
if(typeof indices3[item3] == "number"){
j3 = indices3[item3];
const err31 = {instancePath:instancePath+"/current_state",schemaPath:"#/$defs/stringList/uniqueItems",keyword:"uniqueItems",params:{i: i7, j: j3},message:"must NOT have duplicate items (items ## "+j3+" and "+i7+" are identical)"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
break;
}
indices3[item3] = i7;
}
}
}
else {
const err32 = {instancePath:instancePath+"/current_state",schemaPath:"#/$defs/stringList/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
}
else {
const err33 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
validate25.errors = vErrors;
return errors === 0;
}
validate25.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema46 = {"type":"object","additionalProperties":false,"required":["capture_id","source","disposition"],"properties":{"capture_id":{"$ref":"#/$defs/captureId"},"source":{"$ref":"#/$defs/sourceIdentity"},"disposition":{"$ref":"#/$defs/disposition"}},"allOf":[{"if":{"properties":{"source":{"properties":{"classification":{"enum":["binary","oversized","malformed","secret-bearing","unknown"]}},"required":["classification"]}},"required":["source"]},"then":{"properties":{"disposition":{"properties":{"type":{"const":"review-required"}},"required":["type"]}}}},{"if":{"properties":{"source":{"properties":{"content_access":{"const":"identity-only"}},"required":["content_access"]}},"required":["source"]},"then":{"properties":{"disposition":{"properties":{"type":{"const":"review-required"}},"required":["type"]}}}}]};
const schema47 = {"type":"string","pattern":"^cap-[a-z0-9][a-z0-9._-]{0,79}$"};
const pattern15 = new RegExp("^cap-[a-z0-9][a-z0-9._-]{0,79}$", "u");
const schema48 = {"type":"object","additionalProperties":false,"required":["path","sha256","size_bytes","classification","content_access"],"properties":{"path":{"$ref":"#/$defs/relativePath"},"sha256":{"$ref":"#/$defs/sha256"},"size_bytes":{"type":"integer","minimum":0},"classification":{"type":"string","enum":["markdown","text","binary","oversized","malformed","secret-bearing","unknown"]},"content_access":{"type":"string","enum":["reviewed","identity-only"]},"media_type":{"type":"string","minLength":1,"maxLength":256}},"allOf":[{"if":{"properties":{"classification":{"enum":["binary","oversized","malformed","secret-bearing","unknown"]}},"required":["classification"]},"then":{"properties":{"content_access":{"const":"identity-only"}}}}]};
const schema49 = {"type":"string","minLength":1,"maxLength":1024,"pattern":"^(?!/)(?![A-Za-z][A-Za-z0-9+.-]*:)(?!.*\\\\)(?!.*[\\u0000-\\u001f\\u007f])(?!.*//)(?!.*(?:^|/)\\.\\.?(?:/|$))(?!.*\\/$)[^\\u0000]+$"};
const schema50 = {"type":"string","pattern":"^[0-9a-f]{64}$"};
const pattern16 = new RegExp("^(?!/)(?![A-Za-z][A-Za-z0-9+.-]*:)(?!.*\\\\)(?!.*[\\u0000-\\u001f\\u007f])(?!.*//)(?!.*(?:^|/)\\.\\.?(?:/|$))(?!.*\\/$)[^\\u0000]+$", "u");
const pattern17 = new RegExp("^[0-9a-f]{64}$", "u");

function validate28(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate28.evaluated;
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
if((data.classification === undefined) && (missing0 = "classification")){
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
if(data.classification !== undefined){
let data0 = data.classification;
if(!(((((data0 === "binary") || (data0 === "oversized")) || (data0 === "malformed")) || (data0 === "secret-bearing")) || (data0 === "unknown"))){
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
if(_valid0){
const _errs5 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.content_access !== undefined){
if("identity-only" !== data.content_access){
const err2 = {instancePath:instancePath+"/content_access",schemaPath:"#/allOf/0/then/properties/content_access/const",keyword:"const",params:{allowedValue: "identity-only"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
}
var _valid0 = _errs5 === errors;
valid1 = _valid0;
if(valid1){
var props0 = {};
props0.content_access = true;
props0.classification = true;
}
}
if(!valid1){
const err3 = {instancePath,schemaPath:"#/allOf/0/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.path === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "path"},message:"must have required property '"+"path"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.sha256 === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sha256"},message:"must have required property '"+"sha256"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.size_bytes === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "size_bytes"},message:"must have required property '"+"size_bytes"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.classification === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "classification"},message:"must have required property '"+"classification"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.content_access === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "content_access"},message:"must have required property '"+"content_access"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "path") || (key0 === "sha256")) || (key0 === "size_bytes")) || (key0 === "classification")) || (key0 === "content_access")) || (key0 === "media_type"))){
const err9 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.path !== undefined){
let data2 = data.path;
if(typeof data2 === "string"){
if(func2(data2) > 1024){
const err10 = {instancePath:instancePath+"/path",schemaPath:"#/$defs/relativePath/maxLength",keyword:"maxLength",params:{limit: 1024},message:"must NOT have more than 1024 characters"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(func2(data2) < 1){
const err11 = {instancePath:instancePath+"/path",schemaPath:"#/$defs/relativePath/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(!pattern16.test(data2)){
const err12 = {instancePath:instancePath+"/path",schemaPath:"#/$defs/relativePath/pattern",keyword:"pattern",params:{pattern: "^(?!/)(?![A-Za-z][A-Za-z0-9+.-]*:)(?!.*\\\\)(?!.*[\\u0000-\\u001f\\u007f])(?!.*//)(?!.*(?:^|/)\\.\\.?(?:/|$))(?!.*\\/$)[^\\u0000]+$"},message:"must match pattern \""+"^(?!/)(?![A-Za-z][A-Za-z0-9+.-]*:)(?!.*\\\\)(?!.*[\\u0000-\\u001f\\u007f])(?!.*//)(?!.*(?:^|/)\\.\\.?(?:/|$))(?!.*\\/$)[^\\u0000]+$"+"\""};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
else {
const err13 = {instancePath:instancePath+"/path",schemaPath:"#/$defs/relativePath/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.sha256 !== undefined){
let data3 = data.sha256;
if(typeof data3 === "string"){
if(!pattern17.test(data3)){
const err14 = {instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
else {
const err15 = {instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.size_bytes !== undefined){
let data4 = data.size_bytes;
if(!((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4)))){
const err16 = {instancePath:instancePath+"/size_bytes",schemaPath:"#/properties/size_bytes/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(typeof data4 == "number"){
if(data4 < 0 || isNaN(data4)){
const err17 = {instancePath:instancePath+"/size_bytes",schemaPath:"#/properties/size_bytes/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.classification !== undefined){
let data5 = data.classification;
if(typeof data5 !== "string"){
const err18 = {instancePath:instancePath+"/classification",schemaPath:"#/properties/classification/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(!(((((((data5 === "markdown") || (data5 === "text")) || (data5 === "binary")) || (data5 === "oversized")) || (data5 === "malformed")) || (data5 === "secret-bearing")) || (data5 === "unknown"))){
const err19 = {instancePath:instancePath+"/classification",schemaPath:"#/properties/classification/enum",keyword:"enum",params:{allowedValues: schema48.properties.classification.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.content_access !== undefined){
let data6 = data.content_access;
if(typeof data6 !== "string"){
const err20 = {instancePath:instancePath+"/content_access",schemaPath:"#/properties/content_access/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(!((data6 === "reviewed") || (data6 === "identity-only"))){
const err21 = {instancePath:instancePath+"/content_access",schemaPath:"#/properties/content_access/enum",keyword:"enum",params:{allowedValues: schema48.properties.content_access.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.media_type !== undefined){
let data7 = data.media_type;
if(typeof data7 === "string"){
if(func2(data7) > 256){
const err22 = {instancePath:instancePath+"/media_type",schemaPath:"#/properties/media_type/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(func2(data7) < 1){
const err23 = {instancePath:instancePath+"/media_type",schemaPath:"#/properties/media_type/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
else {
const err24 = {instancePath:instancePath+"/media_type",schemaPath:"#/properties/media_type/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
else {
const err25 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
validate28.errors = vErrors;
return errors === 0;
}
validate28.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema51 = {"oneOf":[{"type":"object","additionalProperties":false,"required":["type","operation_ids"],"properties":{"type":{"const":"create"},"operation_ids":{"type":"array","minItems":1,"uniqueItems":true,"items":{"$ref":"#/$defs/operationId"},"maxItems":32}}},{"type":"object","additionalProperties":false,"required":["type","operation_ids"],"properties":{"type":{"const":"update"},"operation_ids":{"type":"array","minItems":1,"uniqueItems":true,"items":{"$ref":"#/$defs/operationId"},"maxItems":32}}},{"type":"object","additionalProperties":false,"required":["type","operation_ids"],"properties":{"type":{"const":"merge"},"operation_ids":{"type":"array","minItems":1,"uniqueItems":true,"items":{"$ref":"#/$defs/operationId"},"maxItems":32}}},{"type":"object","additionalProperties":false,"required":["type","operation_ids"],"properties":{"type":{"const":"supersede"},"operation_ids":{"type":"array","minItems":1,"uniqueItems":true,"items":{"$ref":"#/$defs/operationId"},"maxItems":32}}},{"type":"object","additionalProperties":false,"required":["type","operation_ids","reason"],"properties":{"type":{"const":"no-durable-change"},"operation_ids":{"type":"array","maxItems":32},"reason":{"$ref":"#/$defs/nonEmptyText"}}},{"type":"object","additionalProperties":false,"required":["type","operation_ids","covered_by"],"properties":{"type":{"const":"duplicate"},"operation_ids":{"type":"array","maxItems":32},"covered_by":{"$ref":"#/$defs/coveredBy"}}},{"type":"object","additionalProperties":false,"required":["type","operation_ids","review"],"properties":{"type":{"const":"review-required"},"operation_ids":{"type":"array","uniqueItems":true,"items":{"$ref":"#/$defs/operationId"},"maxItems":32},"review":{"$ref":"#/$defs/review"}}}]};
const schema52 = {"type":"string","pattern":"^op-[a-z0-9][a-z0-9._-]{0,79}$"};
const schema56 = {"type":"string","minLength":1,"maxLength":2048,"pattern":"^[^\\u0000-\\u001f\\u007f]*\\S[^\\u0000-\\u001f\\u007f]*$"};
const schema62 = {"type":"object","additionalProperties":false,"required":["state","reasons"],"properties":{"state":{"const":"pending"},"reasons":{"type":"array","minItems":1,"items":{"type":"string","minLength":1,"maxLength":512,"pattern":"^[^\\u0000-\\u001f\\u007f]*\\S[^\\u0000-\\u001f\\u007f]*$"},"maxItems":8}}};
const pattern18 = new RegExp("^op-[a-z0-9][a-z0-9._-]{0,79}$", "u");
const pattern22 = new RegExp("^[^\\u0000-\\u001f\\u007f]*\\S[^\\u0000-\\u001f\\u007f]*$", "u");
const func0 = function deepEqual(left, right) {
  if (left === right) return true;
  if (!left || !right || typeof left !== "object" || typeof right !== "object") return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every((key) => Object.prototype.hasOwnProperty.call(right, key) && deepEqual(left[key], right[key]));
};
const schema57 = {"oneOf":[{"type":"object","additionalProperties":false,"required":["kind","ref"],"properties":{"kind":{"const":"capture"},"ref":{"$ref":"#/$defs/captureId"}}},{"type":"object","additionalProperties":false,"required":["kind","ref"],"properties":{"kind":{"const":"concept"},"ref":{"$ref":"#/$defs/conceptId"}}},{"type":"object","additionalProperties":false,"required":["kind","ref"],"properties":{"kind":{"const":"operation"},"ref":{"$ref":"#/$defs/operationId"}}}]};
const schema59 = {"type":"string","pattern":"^okf-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"};
const pattern24 = new RegExp("^okf-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$", "u");

function validate31(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate31.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const _errs0 = errors;
let valid0 = false;
let passing0 = null;
const _errs1 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.kind === undefined){
const err0 = {instancePath,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.ref === undefined){
const err1 = {instancePath,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty: "ref"},message:"must have required property '"+"ref"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "kind") || (key0 === "ref"))){
const err2 = {instancePath,schemaPath:"#/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.kind !== undefined){
if("capture" !== data.kind){
const err3 = {instancePath:instancePath+"/kind",schemaPath:"#/oneOf/0/properties/kind/const",keyword:"const",params:{allowedValue: "capture"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.ref !== undefined){
let data1 = data.ref;
if(typeof data1 === "string"){
if(!pattern15.test(data1)){
const err4 = {instancePath:instancePath+"/ref",schemaPath:"#/$defs/captureId/pattern",keyword:"pattern",params:{pattern: "^cap-[a-z0-9][a-z0-9._-]{0,79}$"},message:"must match pattern \""+"^cap-[a-z0-9][a-z0-9._-]{0,79}$"+"\""};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
else {
const err5 = {instancePath:instancePath+"/ref",schemaPath:"#/$defs/captureId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
}
else {
const err6 = {instancePath,schemaPath:"#/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs8 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.kind === undefined){
const err7 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.ref === undefined){
const err8 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "ref"},message:"must have required property '"+"ref"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
for(const key1 in data){
if(!((key1 === "kind") || (key1 === "ref"))){
const err9 = {instancePath,schemaPath:"#/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.kind !== undefined){
if("concept" !== data.kind){
const err10 = {instancePath:instancePath+"/kind",schemaPath:"#/oneOf/1/properties/kind/const",keyword:"const",params:{allowedValue: "concept"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.ref !== undefined){
let data3 = data.ref;
if(typeof data3 === "string"){
if(!pattern24.test(data3)){
const err11 = {instancePath:instancePath+"/ref",schemaPath:"#/$defs/conceptId/pattern",keyword:"pattern",params:{pattern: "^okf-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^okf-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
else {
const err12 = {instancePath:instancePath+"/ref",schemaPath:"#/$defs/conceptId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
}
else {
const err13 = {instancePath,schemaPath:"#/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
var _valid0 = _errs8 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid0 = true;
passing0 = 1;
if(props0 !== true){
props0 = true;
}
}
const _errs15 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.kind === undefined){
const err14 = {instancePath,schemaPath:"#/oneOf/2/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data.ref === undefined){
const err15 = {instancePath,schemaPath:"#/oneOf/2/required",keyword:"required",params:{missingProperty: "ref"},message:"must have required property '"+"ref"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
for(const key2 in data){
if(!((key2 === "kind") || (key2 === "ref"))){
const err16 = {instancePath,schemaPath:"#/oneOf/2/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.kind !== undefined){
if("operation" !== data.kind){
const err17 = {instancePath:instancePath+"/kind",schemaPath:"#/oneOf/2/properties/kind/const",keyword:"const",params:{allowedValue: "operation"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.ref !== undefined){
let data5 = data.ref;
if(typeof data5 === "string"){
if(!pattern18.test(data5)){
const err18 = {instancePath:instancePath+"/ref",schemaPath:"#/$defs/operationId/pattern",keyword:"pattern",params:{pattern: "^op-[a-z0-9][a-z0-9._-]{0,79}$"},message:"must match pattern \""+"^op-[a-z0-9][a-z0-9._-]{0,79}$"+"\""};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
else {
const err19 = {instancePath:instancePath+"/ref",schemaPath:"#/$defs/operationId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
}
else {
const err20 = {instancePath,schemaPath:"#/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
var _valid0 = _errs15 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid0 = true;
passing0 = 2;
if(props0 !== true){
props0 = true;
}
}
}
}
if(!valid0){
const err21 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
else {
errors = _errs0;
if(vErrors !== null){
if(_errs0){
vErrors.length = _errs0;
}
else {
vErrors = null;
}
}
}
validate31.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate31.evaluated = {"dynamicProps":true,"dynamicItems":false};


function validate30(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate30.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const _errs0 = errors;
let valid0 = false;
let passing0 = null;
const _errs1 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err0 = {instancePath,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.operation_ids === undefined){
const err1 = {instancePath,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty: "operation_ids"},message:"must have required property '"+"operation_ids"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "type") || (key0 === "operation_ids"))){
const err2 = {instancePath,schemaPath:"#/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.type !== undefined){
if("create" !== data.type){
const err3 = {instancePath:instancePath+"/type",schemaPath:"#/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "create"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.operation_ids !== undefined){
let data1 = data.operation_ids;
if(Array.isArray(data1)){
if(data1.length > 32){
const err4 = {instancePath:instancePath+"/operation_ids",schemaPath:"#/oneOf/0/properties/operation_ids/maxItems",keyword:"maxItems",params:{limit: 32},message:"must NOT have more than 32 items"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data1.length < 1){
const err5 = {instancePath:instancePath+"/operation_ids",schemaPath:"#/oneOf/0/properties/operation_ids/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
const len0 = data1.length;
for(let i0=0; i0<len0; i0++){
let data2 = data1[i0];
if(typeof data2 === "string"){
if(!pattern18.test(data2)){
const err6 = {instancePath:instancePath+"/operation_ids/" + i0,schemaPath:"#/$defs/operationId/pattern",keyword:"pattern",params:{pattern: "^op-[a-z0-9][a-z0-9._-]{0,79}$"},message:"must match pattern \""+"^op-[a-z0-9][a-z0-9._-]{0,79}$"+"\""};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
else {
const err7 = {instancePath:instancePath+"/operation_ids/" + i0,schemaPath:"#/$defs/operationId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
let i1 = data1.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data1[i1], data1[j0])){
const err8 = {instancePath:instancePath+"/operation_ids",schemaPath:"#/oneOf/0/properties/operation_ids/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err9 = {instancePath:instancePath+"/operation_ids",schemaPath:"#/oneOf/0/properties/operation_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
}
else {
const err10 = {instancePath,schemaPath:"#/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs10 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err11 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.operation_ids === undefined){
const err12 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "operation_ids"},message:"must have required property '"+"operation_ids"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
for(const key1 in data){
if(!((key1 === "type") || (key1 === "operation_ids"))){
const err13 = {instancePath,schemaPath:"#/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.type !== undefined){
if("update" !== data.type){
const err14 = {instancePath:instancePath+"/type",schemaPath:"#/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "update"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.operation_ids !== undefined){
let data4 = data.operation_ids;
if(Array.isArray(data4)){
if(data4.length > 32){
const err15 = {instancePath:instancePath+"/operation_ids",schemaPath:"#/oneOf/1/properties/operation_ids/maxItems",keyword:"maxItems",params:{limit: 32},message:"must NOT have more than 32 items"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data4.length < 1){
const err16 = {instancePath:instancePath+"/operation_ids",schemaPath:"#/oneOf/1/properties/operation_ids/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
const len1 = data4.length;
for(let i2=0; i2<len1; i2++){
let data5 = data4[i2];
if(typeof data5 === "string"){
if(!pattern18.test(data5)){
const err17 = {instancePath:instancePath+"/operation_ids/" + i2,schemaPath:"#/$defs/operationId/pattern",keyword:"pattern",params:{pattern: "^op-[a-z0-9][a-z0-9._-]{0,79}$"},message:"must match pattern \""+"^op-[a-z0-9][a-z0-9._-]{0,79}$"+"\""};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
else {
const err18 = {instancePath:instancePath+"/operation_ids/" + i2,schemaPath:"#/$defs/operationId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
let i3 = data4.length;
let j1;
if(i3 > 1){
outer1:
for(;i3--;){
for(j1 = i3; j1--;){
if(func0(data4[i3], data4[j1])){
const err19 = {instancePath:instancePath+"/operation_ids",schemaPath:"#/oneOf/1/properties/operation_ids/uniqueItems",keyword:"uniqueItems",params:{i: i3, j: j1},message:"must NOT have duplicate items (items ## "+j1+" and "+i3+" are identical)"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
break outer1;
}
}
}
}
}
else {
const err20 = {instancePath:instancePath+"/operation_ids",schemaPath:"#/oneOf/1/properties/operation_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
else {
const err21 = {instancePath,schemaPath:"#/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
var _valid0 = _errs10 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid0 = true;
passing0 = 1;
if(props0 !== true){
props0 = true;
}
}
const _errs19 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err22 = {instancePath,schemaPath:"#/oneOf/2/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(data.operation_ids === undefined){
const err23 = {instancePath,schemaPath:"#/oneOf/2/required",keyword:"required",params:{missingProperty: "operation_ids"},message:"must have required property '"+"operation_ids"+"'"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
for(const key2 in data){
if(!((key2 === "type") || (key2 === "operation_ids"))){
const err24 = {instancePath,schemaPath:"#/oneOf/2/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.type !== undefined){
if("merge" !== data.type){
const err25 = {instancePath:instancePath+"/type",schemaPath:"#/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "merge"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.operation_ids !== undefined){
let data7 = data.operation_ids;
if(Array.isArray(data7)){
if(data7.length > 32){
const err26 = {instancePath:instancePath+"/operation_ids",schemaPath:"#/oneOf/2/properties/operation_ids/maxItems",keyword:"maxItems",params:{limit: 32},message:"must NOT have more than 32 items"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(data7.length < 1){
const err27 = {instancePath:instancePath+"/operation_ids",schemaPath:"#/oneOf/2/properties/operation_ids/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
const len2 = data7.length;
for(let i4=0; i4<len2; i4++){
let data8 = data7[i4];
if(typeof data8 === "string"){
if(!pattern18.test(data8)){
const err28 = {instancePath:instancePath+"/operation_ids/" + i4,schemaPath:"#/$defs/operationId/pattern",keyword:"pattern",params:{pattern: "^op-[a-z0-9][a-z0-9._-]{0,79}$"},message:"must match pattern \""+"^op-[a-z0-9][a-z0-9._-]{0,79}$"+"\""};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
else {
const err29 = {instancePath:instancePath+"/operation_ids/" + i4,schemaPath:"#/$defs/operationId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
let i5 = data7.length;
let j2;
if(i5 > 1){
outer2:
for(;i5--;){
for(j2 = i5; j2--;){
if(func0(data7[i5], data7[j2])){
const err30 = {instancePath:instancePath+"/operation_ids",schemaPath:"#/oneOf/2/properties/operation_ids/uniqueItems",keyword:"uniqueItems",params:{i: i5, j: j2},message:"must NOT have duplicate items (items ## "+j2+" and "+i5+" are identical)"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
break outer2;
}
}
}
}
}
else {
const err31 = {instancePath:instancePath+"/operation_ids",schemaPath:"#/oneOf/2/properties/operation_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
}
else {
const err32 = {instancePath,schemaPath:"#/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
var _valid0 = _errs19 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid0 = true;
passing0 = 2;
if(props0 !== true){
props0 = true;
}
}
const _errs28 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err33 = {instancePath,schemaPath:"#/oneOf/3/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(data.operation_ids === undefined){
const err34 = {instancePath,schemaPath:"#/oneOf/3/required",keyword:"required",params:{missingProperty: "operation_ids"},message:"must have required property '"+"operation_ids"+"'"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
for(const key3 in data){
if(!((key3 === "type") || (key3 === "operation_ids"))){
const err35 = {instancePath,schemaPath:"#/oneOf/3/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data.type !== undefined){
if("supersede" !== data.type){
const err36 = {instancePath:instancePath+"/type",schemaPath:"#/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue: "supersede"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
if(data.operation_ids !== undefined){
let data10 = data.operation_ids;
if(Array.isArray(data10)){
if(data10.length > 32){
const err37 = {instancePath:instancePath+"/operation_ids",schemaPath:"#/oneOf/3/properties/operation_ids/maxItems",keyword:"maxItems",params:{limit: 32},message:"must NOT have more than 32 items"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
if(data10.length < 1){
const err38 = {instancePath:instancePath+"/operation_ids",schemaPath:"#/oneOf/3/properties/operation_ids/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
const len3 = data10.length;
for(let i6=0; i6<len3; i6++){
let data11 = data10[i6];
if(typeof data11 === "string"){
if(!pattern18.test(data11)){
const err39 = {instancePath:instancePath+"/operation_ids/" + i6,schemaPath:"#/$defs/operationId/pattern",keyword:"pattern",params:{pattern: "^op-[a-z0-9][a-z0-9._-]{0,79}$"},message:"must match pattern \""+"^op-[a-z0-9][a-z0-9._-]{0,79}$"+"\""};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
else {
const err40 = {instancePath:instancePath+"/operation_ids/" + i6,schemaPath:"#/$defs/operationId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
let i7 = data10.length;
let j3;
if(i7 > 1){
outer3:
for(;i7--;){
for(j3 = i7; j3--;){
if(func0(data10[i7], data10[j3])){
const err41 = {instancePath:instancePath+"/operation_ids",schemaPath:"#/oneOf/3/properties/operation_ids/uniqueItems",keyword:"uniqueItems",params:{i: i7, j: j3},message:"must NOT have duplicate items (items ## "+j3+" and "+i7+" are identical)"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
break outer3;
}
}
}
}
}
else {
const err42 = {instancePath:instancePath+"/operation_ids",schemaPath:"#/oneOf/3/properties/operation_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
}
else {
const err43 = {instancePath,schemaPath:"#/oneOf/3/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
var _valid0 = _errs28 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid0 = true;
passing0 = 3;
if(props0 !== true){
props0 = true;
}
}
const _errs37 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err44 = {instancePath,schemaPath:"#/oneOf/4/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if(data.operation_ids === undefined){
const err45 = {instancePath,schemaPath:"#/oneOf/4/required",keyword:"required",params:{missingProperty: "operation_ids"},message:"must have required property '"+"operation_ids"+"'"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(data.reason === undefined){
const err46 = {instancePath,schemaPath:"#/oneOf/4/required",keyword:"required",params:{missingProperty: "reason"},message:"must have required property '"+"reason"+"'"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
for(const key4 in data){
if(!(((key4 === "type") || (key4 === "operation_ids")) || (key4 === "reason"))){
const err47 = {instancePath,schemaPath:"#/oneOf/4/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
if(data.type !== undefined){
if("no-durable-change" !== data.type){
const err48 = {instancePath:instancePath+"/type",schemaPath:"#/oneOf/4/properties/type/const",keyword:"const",params:{allowedValue: "no-durable-change"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
}
if(data.operation_ids !== undefined){
let data13 = data.operation_ids;
if(Array.isArray(data13)){
if(data13.length > 32){
const err49 = {instancePath:instancePath+"/operation_ids",schemaPath:"#/oneOf/4/properties/operation_ids/maxItems",keyword:"maxItems",params:{limit: 32},message:"must NOT have more than 32 items"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
else {
const err50 = {instancePath:instancePath+"/operation_ids",schemaPath:"#/oneOf/4/properties/operation_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
}
if(data.reason !== undefined){
let data14 = data.reason;
if(typeof data14 === "string"){
if(func2(data14) > 2048){
const err51 = {instancePath:instancePath+"/reason",schemaPath:"#/$defs/nonEmptyText/maxLength",keyword:"maxLength",params:{limit: 2048},message:"must NOT have more than 2048 characters"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
if(func2(data14) < 1){
const err52 = {instancePath:instancePath+"/reason",schemaPath:"#/$defs/nonEmptyText/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
if(!pattern22.test(data14)){
const err53 = {instancePath:instancePath+"/reason",schemaPath:"#/$defs/nonEmptyText/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]*\\S[^\\u0000-\\u001f\\u007f]*$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]*\\S[^\\u0000-\\u001f\\u007f]*$"+"\""};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
}
else {
const err54 = {instancePath:instancePath+"/reason",schemaPath:"#/$defs/nonEmptyText/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
}
else {
const err55 = {instancePath,schemaPath:"#/oneOf/4/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
var _valid0 = _errs37 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 4];
}
else {
if(_valid0){
valid0 = true;
passing0 = 4;
if(props0 !== true){
props0 = true;
}
}
const _errs46 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err56 = {instancePath,schemaPath:"#/oneOf/5/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
if(data.operation_ids === undefined){
const err57 = {instancePath,schemaPath:"#/oneOf/5/required",keyword:"required",params:{missingProperty: "operation_ids"},message:"must have required property '"+"operation_ids"+"'"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if(data.covered_by === undefined){
const err58 = {instancePath,schemaPath:"#/oneOf/5/required",keyword:"required",params:{missingProperty: "covered_by"},message:"must have required property '"+"covered_by"+"'"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
for(const key5 in data){
if(!(((key5 === "type") || (key5 === "operation_ids")) || (key5 === "covered_by"))){
const err59 = {instancePath,schemaPath:"#/oneOf/5/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key5},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
}
if(data.type !== undefined){
if("duplicate" !== data.type){
const err60 = {instancePath:instancePath+"/type",schemaPath:"#/oneOf/5/properties/type/const",keyword:"const",params:{allowedValue: "duplicate"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
}
if(data.operation_ids !== undefined){
let data16 = data.operation_ids;
if(Array.isArray(data16)){
if(data16.length > 32){
const err61 = {instancePath:instancePath+"/operation_ids",schemaPath:"#/oneOf/5/properties/operation_ids/maxItems",keyword:"maxItems",params:{limit: 32},message:"must NOT have more than 32 items"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
}
else {
const err62 = {instancePath:instancePath+"/operation_ids",schemaPath:"#/oneOf/5/properties/operation_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
}
if(data.covered_by !== undefined){
if(!(validate31(data.covered_by, {instancePath:instancePath+"/covered_by",parentData:data,parentDataProperty:"covered_by",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate31.errors : vErrors.concat(validate31.errors);
errors = vErrors.length;
}
}
}
else {
const err63 = {instancePath,schemaPath:"#/oneOf/5/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
var _valid0 = _errs46 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 5];
}
else {
if(_valid0){
valid0 = true;
passing0 = 5;
if(props0 !== true){
props0 = true;
}
}
const _errs53 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err64 = {instancePath,schemaPath:"#/oneOf/6/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
if(data.operation_ids === undefined){
const err65 = {instancePath,schemaPath:"#/oneOf/6/required",keyword:"required",params:{missingProperty: "operation_ids"},message:"must have required property '"+"operation_ids"+"'"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
if(data.review === undefined){
const err66 = {instancePath,schemaPath:"#/oneOf/6/required",keyword:"required",params:{missingProperty: "review"},message:"must have required property '"+"review"+"'"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
for(const key6 in data){
if(!(((key6 === "type") || (key6 === "operation_ids")) || (key6 === "review"))){
const err67 = {instancePath,schemaPath:"#/oneOf/6/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key6},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
}
if(data.type !== undefined){
if("review-required" !== data.type){
const err68 = {instancePath:instancePath+"/type",schemaPath:"#/oneOf/6/properties/type/const",keyword:"const",params:{allowedValue: "review-required"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
}
if(data.operation_ids !== undefined){
let data19 = data.operation_ids;
if(Array.isArray(data19)){
if(data19.length > 32){
const err69 = {instancePath:instancePath+"/operation_ids",schemaPath:"#/oneOf/6/properties/operation_ids/maxItems",keyword:"maxItems",params:{limit: 32},message:"must NOT have more than 32 items"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
const len4 = data19.length;
for(let i8=0; i8<len4; i8++){
let data20 = data19[i8];
if(typeof data20 === "string"){
if(!pattern18.test(data20)){
const err70 = {instancePath:instancePath+"/operation_ids/" + i8,schemaPath:"#/$defs/operationId/pattern",keyword:"pattern",params:{pattern: "^op-[a-z0-9][a-z0-9._-]{0,79}$"},message:"must match pattern \""+"^op-[a-z0-9][a-z0-9._-]{0,79}$"+"\""};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
}
else {
const err71 = {instancePath:instancePath+"/operation_ids/" + i8,schemaPath:"#/$defs/operationId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
}
let i9 = data19.length;
let j4;
if(i9 > 1){
outer4:
for(;i9--;){
for(j4 = i9; j4--;){
if(func0(data19[i9], data19[j4])){
const err72 = {instancePath:instancePath+"/operation_ids",schemaPath:"#/oneOf/6/properties/operation_ids/uniqueItems",keyword:"uniqueItems",params:{i: i9, j: j4},message:"must NOT have duplicate items (items ## "+j4+" and "+i9+" are identical)"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
break outer4;
}
}
}
}
}
else {
const err73 = {instancePath:instancePath+"/operation_ids",schemaPath:"#/oneOf/6/properties/operation_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
}
if(data.review !== undefined){
let data21 = data.review;
if(data21 && typeof data21 == "object" && !Array.isArray(data21)){
if(data21.state === undefined){
const err74 = {instancePath:instancePath+"/review",schemaPath:"#/$defs/review/required",keyword:"required",params:{missingProperty: "state"},message:"must have required property '"+"state"+"'"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
if(data21.reasons === undefined){
const err75 = {instancePath:instancePath+"/review",schemaPath:"#/$defs/review/required",keyword:"required",params:{missingProperty: "reasons"},message:"must have required property '"+"reasons"+"'"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
for(const key7 in data21){
if(!((key7 === "state") || (key7 === "reasons"))){
const err76 = {instancePath:instancePath+"/review",schemaPath:"#/$defs/review/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key7},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
}
if(data21.state !== undefined){
if("pending" !== data21.state){
const err77 = {instancePath:instancePath+"/review/state",schemaPath:"#/$defs/review/properties/state/const",keyword:"const",params:{allowedValue: "pending"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
}
if(data21.reasons !== undefined){
let data23 = data21.reasons;
if(Array.isArray(data23)){
if(data23.length > 8){
const err78 = {instancePath:instancePath+"/review/reasons",schemaPath:"#/$defs/review/properties/reasons/maxItems",keyword:"maxItems",params:{limit: 8},message:"must NOT have more than 8 items"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
if(data23.length < 1){
const err79 = {instancePath:instancePath+"/review/reasons",schemaPath:"#/$defs/review/properties/reasons/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
const len5 = data23.length;
for(let i10=0; i10<len5; i10++){
let data24 = data23[i10];
if(typeof data24 === "string"){
if(func2(data24) > 512){
const err80 = {instancePath:instancePath+"/review/reasons/" + i10,schemaPath:"#/$defs/review/properties/reasons/items/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
if(func2(data24) < 1){
const err81 = {instancePath:instancePath+"/review/reasons/" + i10,schemaPath:"#/$defs/review/properties/reasons/items/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
if(!pattern22.test(data24)){
const err82 = {instancePath:instancePath+"/review/reasons/" + i10,schemaPath:"#/$defs/review/properties/reasons/items/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]*\\S[^\\u0000-\\u001f\\u007f]*$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]*\\S[^\\u0000-\\u001f\\u007f]*$"+"\""};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
}
else {
const err83 = {instancePath:instancePath+"/review/reasons/" + i10,schemaPath:"#/$defs/review/properties/reasons/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
}
}
else {
const err84 = {instancePath:instancePath+"/review/reasons",schemaPath:"#/$defs/review/properties/reasons/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
}
}
else {
const err85 = {instancePath:instancePath+"/review",schemaPath:"#/$defs/review/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
}
}
else {
const err86 = {instancePath,schemaPath:"#/oneOf/6/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
var _valid0 = _errs53 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 6];
}
else {
if(_valid0){
valid0 = true;
passing0 = 6;
if(props0 !== true){
props0 = true;
}
}
}
}
}
}
}
}
if(!valid0){
const err87 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
else {
errors = _errs0;
if(vErrors !== null){
if(_errs0){
vErrors.length = _errs0;
}
else {
vErrors = null;
}
}
}
validate30.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate30.evaluated = {"dynamicProps":true,"dynamicItems":false};


function validate27(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate27.evaluated;
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
if((data.source === undefined) && (missing0 = "source")){
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
if(data.source !== undefined){
let data0 = data.source;
if(data0 && typeof data0 == "object" && !Array.isArray(data0)){
let missing1;
if((data0.classification === undefined) && (missing1 = "classification")){
const err1 = {};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
else {
if(data0.classification !== undefined){
let data1 = data0.classification;
if(!(((((data1 === "binary") || (data1 === "oversized")) || (data1 === "malformed")) || (data1 === "secret-bearing")) || (data1 === "unknown"))){
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
}
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
if(_valid0){
const _errs6 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.disposition !== undefined){
let data2 = data.disposition;
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.type === undefined){
const err3 = {instancePath:instancePath+"/disposition",schemaPath:"#/allOf/0/then/properties/disposition/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data2.type !== undefined){
if("review-required" !== data2.type){
const err4 = {instancePath:instancePath+"/disposition/type",schemaPath:"#/allOf/0/then/properties/disposition/properties/type/const",keyword:"const",params:{allowedValue: "review-required"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
}
}
}
var _valid0 = _errs6 === errors;
valid1 = _valid0;
if(valid1){
var props0 = {};
props0.disposition = true;
props0.source = true;
}
}
if(!valid1){
const err5 = {instancePath,schemaPath:"#/allOf/0/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
const _errs10 = errors;
let valid6 = true;
const _errs11 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing2;
if((data.source === undefined) && (missing2 = "source")){
const err6 = {};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
else {
if(data.source !== undefined){
let data4 = data.source;
if(data4 && typeof data4 == "object" && !Array.isArray(data4)){
let missing3;
if((data4.content_access === undefined) && (missing3 = "content_access")){
const err7 = {};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
else {
if(data4.content_access !== undefined){
if("identity-only" !== data4.content_access){
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
}
}
}
}
}
var _valid1 = _errs11 === errors;
errors = _errs10;
if(vErrors !== null){
if(_errs10){
vErrors.length = _errs10;
}
else {
vErrors = null;
}
}
if(_valid1){
const _errs14 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.disposition !== undefined){
let data6 = data.disposition;
if(data6 && typeof data6 == "object" && !Array.isArray(data6)){
if(data6.type === undefined){
const err9 = {instancePath:instancePath+"/disposition",schemaPath:"#/allOf/1/then/properties/disposition/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data6.type !== undefined){
if("review-required" !== data6.type){
const err10 = {instancePath:instancePath+"/disposition/type",schemaPath:"#/allOf/1/then/properties/disposition/properties/type/const",keyword:"const",params:{allowedValue: "review-required"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
}
}
}
var _valid1 = _errs14 === errors;
valid6 = _valid1;
if(valid6){
var props1 = {};
props1.disposition = true;
props1.source = true;
}
}
if(!valid6){
const err11 = {instancePath,schemaPath:"#/allOf/1/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
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
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.capture_id === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "capture_id"},message:"must have required property '"+"capture_id"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data.source === undefined){
const err13 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source"},message:"must have required property '"+"source"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data.disposition === undefined){
const err14 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "disposition"},message:"must have required property '"+"disposition"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "capture_id") || (key0 === "source")) || (key0 === "disposition"))){
const err15 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.capture_id !== undefined){
let data8 = data.capture_id;
if(typeof data8 === "string"){
if(!pattern15.test(data8)){
const err16 = {instancePath:instancePath+"/capture_id",schemaPath:"#/$defs/captureId/pattern",keyword:"pattern",params:{pattern: "^cap-[a-z0-9][a-z0-9._-]{0,79}$"},message:"must match pattern \""+"^cap-[a-z0-9][a-z0-9._-]{0,79}$"+"\""};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
else {
const err17 = {instancePath:instancePath+"/capture_id",schemaPath:"#/$defs/captureId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.source !== undefined){
if(!(validate28(data.source, {instancePath:instancePath+"/source",parentData:data,parentDataProperty:"source",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate28.errors : vErrors.concat(validate28.errors);
errors = vErrors.length;
}
}
if(data.disposition !== undefined){
if(!(validate30(data.disposition, {instancePath:instancePath+"/disposition",parentData:data,parentDataProperty:"disposition",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate30.errors : vErrors.concat(validate30.errors);
errors = vErrors.length;
}
}
}
else {
const err18 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
validate27.errors = vErrors;
return errors === 0;
}
validate27.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema63 = {"type":"object","additionalProperties":false,"required":["operation_id","sequence","kind","capture_ids","depends_on","idempotency_key","target","change","claims"],"properties":{"operation_id":{"$ref":"#/$defs/operationId"},"sequence":{"type":"integer","minimum":1},"kind":{"type":"string","enum":["create","update","merge","supersede"]},"capture_ids":{"type":"array","minItems":1,"uniqueItems":true,"items":{"$ref":"#/$defs/captureId"},"maxItems":128},"depends_on":{"type":"array","uniqueItems":true,"items":{"$ref":"#/$defs/operationId"},"maxItems":32},"idempotency_key":{"$ref":"#/$defs/sha256"},"target":{"$ref":"#/$defs/target"},"change":{"$ref":"#/$defs/change"},"claims":{"type":"array","minItems":1,"items":{"$ref":"#/$defs/claim"},"maxItems":8},"source_concept_ids":{"type":"array","minItems":2,"uniqueItems":true,"items":{"$ref":"#/$defs/conceptId"},"maxItems":128},"deprecation":{"$ref":"#/$defs/deprecation"}},"allOf":[{"if":{"properties":{"kind":{"const":"create"}},"required":["kind"]},"then":{"properties":{"target":{"properties":{"expected":{"required":["absent"]}}}}}},{"if":{"properties":{"kind":{"enum":["update","merge","supersede"]}},"required":["kind"]},"then":{"properties":{"target":{"properties":{"expected":{"required":["sha256"]}}}}}},{"if":{"properties":{"kind":{"const":"merge"}},"required":["kind"]},"then":{"required":["source_concept_ids"],"not":{"required":["deprecation"]}},"else":{"not":{"required":["source_concept_ids"]}}},{"if":{"properties":{"kind":{"const":"supersede"}},"required":["kind"]},"then":{"required":["deprecation"],"not":{"required":["source_concept_ids"]}},"else":{"not":{"required":["deprecation"]}}}]};
const schema68 = {"type":"object","additionalProperties":false,"required":["concept_id","path","expected"],"properties":{"concept_id":{"$ref":"#/$defs/conceptId"},"path":{"$ref":"#/$defs/conceptPath"},"expected":{"oneOf":[{"type":"object","additionalProperties":false,"required":["absent"],"properties":{"absent":{"const":true}}},{"type":"object","additionalProperties":false,"required":["sha256"],"properties":{"sha256":{"$ref":"#/$defs/sha256"}}}]}}};
const schema70 = {"type":"string","pattern":"^knowledge/(?:architecture|components|domain|decisions|process|deprecation|state)/[a-z0-9][a-z0-9.-]*\\.md$"};
const pattern33 = new RegExp("^knowledge/(?:architecture|components|domain|decisions|process|deprecation|state)/[a-z0-9][a-z0-9.-]*\\.md$", "u");

function validate36(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate36.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.concept_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "concept_id"},message:"must have required property '"+"concept_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.path === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "path"},message:"must have required property '"+"path"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.expected === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "expected"},message:"must have required property '"+"expected"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "concept_id") || (key0 === "path")) || (key0 === "expected"))){
const err3 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.concept_id !== undefined){
let data0 = data.concept_id;
if(typeof data0 === "string"){
if(!pattern24.test(data0)){
const err4 = {instancePath:instancePath+"/concept_id",schemaPath:"#/$defs/conceptId/pattern",keyword:"pattern",params:{pattern: "^okf-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^okf-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
else {
const err5 = {instancePath:instancePath+"/concept_id",schemaPath:"#/$defs/conceptId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.path !== undefined){
let data1 = data.path;
if(typeof data1 === "string"){
if(!pattern33.test(data1)){
const err6 = {instancePath:instancePath+"/path",schemaPath:"#/$defs/conceptPath/pattern",keyword:"pattern",params:{pattern: "^knowledge/(?:architecture|components|domain|decisions|process|deprecation|state)/[a-z0-9][a-z0-9.-]*\\.md$"},message:"must match pattern \""+"^knowledge/(?:architecture|components|domain|decisions|process|deprecation|state)/[a-z0-9][a-z0-9.-]*\\.md$"+"\""};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
else {
const err7 = {instancePath:instancePath+"/path",schemaPath:"#/$defs/conceptPath/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.expected !== undefined){
let data2 = data.expected;
const _errs9 = errors;
let valid3 = false;
let passing0 = null;
const _errs10 = errors;
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.absent === undefined){
const err8 = {instancePath:instancePath+"/expected",schemaPath:"#/properties/expected/oneOf/0/required",keyword:"required",params:{missingProperty: "absent"},message:"must have required property '"+"absent"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
for(const key1 in data2){
if(!(key1 === "absent")){
const err9 = {instancePath:instancePath+"/expected",schemaPath:"#/properties/expected/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data2.absent !== undefined){
if(true !== data2.absent){
const err10 = {instancePath:instancePath+"/expected/absent",schemaPath:"#/properties/expected/oneOf/0/properties/absent/const",keyword:"const",params:{allowedValue: true},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
}
else {
const err11 = {instancePath:instancePath+"/expected",schemaPath:"#/properties/expected/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
var _valid0 = _errs10 === errors;
if(_valid0){
valid3 = true;
passing0 = 0;
var props0 = true;
}
const _errs14 = errors;
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.sha256 === undefined){
const err12 = {instancePath:instancePath+"/expected",schemaPath:"#/properties/expected/oneOf/1/required",keyword:"required",params:{missingProperty: "sha256"},message:"must have required property '"+"sha256"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
for(const key2 in data2){
if(!(key2 === "sha256")){
const err13 = {instancePath:instancePath+"/expected",schemaPath:"#/properties/expected/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data2.sha256 !== undefined){
let data4 = data2.sha256;
if(typeof data4 === "string"){
if(!pattern17.test(data4)){
const err14 = {instancePath:instancePath+"/expected/sha256",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
else {
const err15 = {instancePath:instancePath+"/expected/sha256",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
}
else {
const err16 = {instancePath:instancePath+"/expected",schemaPath:"#/properties/expected/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
var _valid0 = _errs14 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid3 = true;
passing0 = 1;
if(props0 !== true){
props0 = true;
}
}
}
if(!valid3){
const err17 = {instancePath:instancePath+"/expected",schemaPath:"#/properties/expected/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
else {
errors = _errs9;
if(vErrors !== null){
if(_errs9){
vErrors.length = _errs9;
}
else {
vErrors = null;
}
}
}
}
}
else {
const err18 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
validate36.errors = vErrors;
return errors === 0;
}
validate36.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema72 = {"type":"object","additionalProperties":false,"required":["mode","value","sha256"],"properties":{"mode":{"const":"exact-content"},"value":{"type":"string","minLength":1,"maxLength":65536},"sha256":{"$ref":"#/$defs/sha256"}}};

function validate38(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate38.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.mode === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.value === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "value"},message:"must have required property '"+"value"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.sha256 === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sha256"},message:"must have required property '"+"sha256"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "mode") || (key0 === "value")) || (key0 === "sha256"))){
const err3 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.mode !== undefined){
if("exact-content" !== data.mode){
const err4 = {instancePath:instancePath+"/mode",schemaPath:"#/properties/mode/const",keyword:"const",params:{allowedValue: "exact-content"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.value !== undefined){
let data1 = data.value;
if(typeof data1 === "string"){
if(func2(data1) > 65536){
const err5 = {instancePath:instancePath+"/value",schemaPath:"#/properties/value/maxLength",keyword:"maxLength",params:{limit: 65536},message:"must NOT have more than 65536 characters"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(func2(data1) < 1){
const err6 = {instancePath:instancePath+"/value",schemaPath:"#/properties/value/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
else {
const err7 = {instancePath:instancePath+"/value",schemaPath:"#/properties/value/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.sha256 !== undefined){
let data2 = data.sha256;
if(typeof data2 === "string"){
if(!pattern17.test(data2)){
const err8 = {instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
else {
const err9 = {instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
}
else {
const err10 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
validate38.errors = vErrors;
return errors === 0;
}
validate38.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema74 = {"type":"object","additionalProperties":false,"required":["claim_id","statement","assertion_state","evidence_ids"],"properties":{"claim_id":{"$ref":"#/$defs/claimId"},"statement":{"type":"string","minLength":1,"maxLength":2048,"pattern":"^[^\\u0000-\\u001f\\u007f]*\\S[^\\u0000-\\u001f\\u007f]*$"},"assertion_state":{"type":"string","enum":["proposed","inferred","verified"]},"evidence_ids":{"type":"array","uniqueItems":true,"items":{"$ref":"#/$defs/evidenceId"},"maxItems":128}},"allOf":[{"if":{"properties":{"assertion_state":{"const":"verified"}},"required":["assertion_state"]},"then":{"properties":{"evidence_ids":{"minItems":1}}}},{"if":{"properties":{"assertion_state":{"const":"inferred"}},"required":["assertion_state"]},"then":{"properties":{"evidence_ids":{"minItems":1}}}}]};
const schema75 = {"type":"string","pattern":"^claim-[a-z0-9][a-z0-9._-]{0,79}$"};
const schema76 = {"type":"string","pattern":"^ev-[a-z0-9][a-z0-9._-]{0,79}$"};
const pattern36 = new RegExp("^claim-[a-z0-9][a-z0-9._-]{0,79}$", "u");
const pattern38 = new RegExp("^ev-[a-z0-9][a-z0-9._-]{0,79}$", "u");

function validate40(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate40.evaluated;
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
if((data.assertion_state === undefined) && (missing0 = "assertion_state")){
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
if(data.assertion_state !== undefined){
if("verified" !== data.assertion_state){
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
if(_valid0){
const _errs5 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.evidence_ids !== undefined){
let data1 = data.evidence_ids;
if(Array.isArray(data1)){
if(data1.length < 1){
const err2 = {instancePath:instancePath+"/evidence_ids",schemaPath:"#/allOf/0/then/properties/evidence_ids/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
}
}
var _valid0 = _errs5 === errors;
valid1 = _valid0;
if(valid1){
var props0 = {};
props0.evidence_ids = true;
props0.assertion_state = true;
}
}
if(!valid1){
const err3 = {instancePath,schemaPath:"#/allOf/0/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
const _errs8 = errors;
let valid4 = true;
const _errs9 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing1;
if((data.assertion_state === undefined) && (missing1 = "assertion_state")){
const err4 = {};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
else {
if(data.assertion_state !== undefined){
if("inferred" !== data.assertion_state){
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
}
}
var _valid1 = _errs9 === errors;
errors = _errs8;
if(vErrors !== null){
if(_errs8){
vErrors.length = _errs8;
}
else {
vErrors = null;
}
}
if(_valid1){
const _errs11 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.evidence_ids !== undefined){
let data3 = data.evidence_ids;
if(Array.isArray(data3)){
if(data3.length < 1){
const err6 = {instancePath:instancePath+"/evidence_ids",schemaPath:"#/allOf/1/then/properties/evidence_ids/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
}
}
var _valid1 = _errs11 === errors;
valid4 = _valid1;
if(valid4){
var props1 = {};
props1.evidence_ids = true;
props1.assertion_state = true;
}
}
if(!valid4){
const err7 = {instancePath,schemaPath:"#/allOf/1/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
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
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.claim_id === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "claim_id"},message:"must have required property '"+"claim_id"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.statement === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "statement"},message:"must have required property '"+"statement"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.assertion_state === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "assertion_state"},message:"must have required property '"+"assertion_state"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.evidence_ids === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "evidence_ids"},message:"must have required property '"+"evidence_ids"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "claim_id") || (key0 === "statement")) || (key0 === "assertion_state")) || (key0 === "evidence_ids"))){
const err12 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.claim_id !== undefined){
let data4 = data.claim_id;
if(typeof data4 === "string"){
if(!pattern36.test(data4)){
const err13 = {instancePath:instancePath+"/claim_id",schemaPath:"#/$defs/claimId/pattern",keyword:"pattern",params:{pattern: "^claim-[a-z0-9][a-z0-9._-]{0,79}$"},message:"must match pattern \""+"^claim-[a-z0-9][a-z0-9._-]{0,79}$"+"\""};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
else {
const err14 = {instancePath:instancePath+"/claim_id",schemaPath:"#/$defs/claimId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.statement !== undefined){
let data5 = data.statement;
if(typeof data5 === "string"){
if(func2(data5) > 2048){
const err15 = {instancePath:instancePath+"/statement",schemaPath:"#/properties/statement/maxLength",keyword:"maxLength",params:{limit: 2048},message:"must NOT have more than 2048 characters"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(func2(data5) < 1){
const err16 = {instancePath:instancePath+"/statement",schemaPath:"#/properties/statement/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(!pattern22.test(data5)){
const err17 = {instancePath:instancePath+"/statement",schemaPath:"#/properties/statement/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]*\\S[^\\u0000-\\u001f\\u007f]*$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]*\\S[^\\u0000-\\u001f\\u007f]*$"+"\""};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
else {
const err18 = {instancePath:instancePath+"/statement",schemaPath:"#/properties/statement/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.assertion_state !== undefined){
let data6 = data.assertion_state;
if(typeof data6 !== "string"){
const err19 = {instancePath:instancePath+"/assertion_state",schemaPath:"#/properties/assertion_state/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(!(((data6 === "proposed") || (data6 === "inferred")) || (data6 === "verified"))){
const err20 = {instancePath:instancePath+"/assertion_state",schemaPath:"#/properties/assertion_state/enum",keyword:"enum",params:{allowedValues: schema74.properties.assertion_state.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data.evidence_ids !== undefined){
let data7 = data.evidence_ids;
if(Array.isArray(data7)){
if(data7.length > 128){
const err21 = {instancePath:instancePath+"/evidence_ids",schemaPath:"#/properties/evidence_ids/maxItems",keyword:"maxItems",params:{limit: 128},message:"must NOT have more than 128 items"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
const len0 = data7.length;
for(let i0=0; i0<len0; i0++){
let data8 = data7[i0];
if(typeof data8 === "string"){
if(!pattern38.test(data8)){
const err22 = {instancePath:instancePath+"/evidence_ids/" + i0,schemaPath:"#/$defs/evidenceId/pattern",keyword:"pattern",params:{pattern: "^ev-[a-z0-9][a-z0-9._-]{0,79}$"},message:"must match pattern \""+"^ev-[a-z0-9][a-z0-9._-]{0,79}$"+"\""};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
else {
const err23 = {instancePath:instancePath+"/evidence_ids/" + i0,schemaPath:"#/$defs/evidenceId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
let i1 = data7.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data7[i1], data7[j0])){
const err24 = {instancePath:instancePath+"/evidence_ids",schemaPath:"#/properties/evidence_ids/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err25 = {instancePath:instancePath+"/evidence_ids",schemaPath:"#/properties/evidence_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
}
else {
const err26 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
validate40.errors = vErrors;
return errors === 0;
}
validate40.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema78 = {"type":"object","additionalProperties":false,"required":["replacement_concept_id","superseded_concept_ids","reason"],"properties":{"replacement_concept_id":{"$ref":"#/$defs/conceptId"},"superseded_concept_ids":{"type":"array","minItems":1,"uniqueItems":true,"items":{"$ref":"#/$defs/conceptId"},"maxItems":128},"reason":{"$ref":"#/$defs/nonEmptyText"},"extended_lessons":{"type":"array","items":{"type":"string","minLength":1,"maxLength":1024,"pattern":"^[^\\u0000-\\u001f\\u007f]*\\S[^\\u0000-\\u001f\\u007f]*$"},"maxItems":8}}};

function validate42(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate42.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.replacement_concept_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "replacement_concept_id"},message:"must have required property '"+"replacement_concept_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.superseded_concept_ids === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "superseded_concept_ids"},message:"must have required property '"+"superseded_concept_ids"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.reason === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "reason"},message:"must have required property '"+"reason"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "replacement_concept_id") || (key0 === "superseded_concept_ids")) || (key0 === "reason")) || (key0 === "extended_lessons"))){
const err3 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.replacement_concept_id !== undefined){
let data0 = data.replacement_concept_id;
if(typeof data0 === "string"){
if(!pattern24.test(data0)){
const err4 = {instancePath:instancePath+"/replacement_concept_id",schemaPath:"#/$defs/conceptId/pattern",keyword:"pattern",params:{pattern: "^okf-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^okf-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
else {
const err5 = {instancePath:instancePath+"/replacement_concept_id",schemaPath:"#/$defs/conceptId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.superseded_concept_ids !== undefined){
let data1 = data.superseded_concept_ids;
if(Array.isArray(data1)){
if(data1.length > 128){
const err6 = {instancePath:instancePath+"/superseded_concept_ids",schemaPath:"#/properties/superseded_concept_ids/maxItems",keyword:"maxItems",params:{limit: 128},message:"must NOT have more than 128 items"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data1.length < 1){
const err7 = {instancePath:instancePath+"/superseded_concept_ids",schemaPath:"#/properties/superseded_concept_ids/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
const len0 = data1.length;
for(let i0=0; i0<len0; i0++){
let data2 = data1[i0];
if(typeof data2 === "string"){
if(!pattern24.test(data2)){
const err8 = {instancePath:instancePath+"/superseded_concept_ids/" + i0,schemaPath:"#/$defs/conceptId/pattern",keyword:"pattern",params:{pattern: "^okf-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^okf-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
else {
const err9 = {instancePath:instancePath+"/superseded_concept_ids/" + i0,schemaPath:"#/$defs/conceptId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
let i1 = data1.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data1[i1], data1[j0])){
const err10 = {instancePath:instancePath+"/superseded_concept_ids",schemaPath:"#/properties/superseded_concept_ids/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err11 = {instancePath:instancePath+"/superseded_concept_ids",schemaPath:"#/properties/superseded_concept_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.reason !== undefined){
let data3 = data.reason;
if(typeof data3 === "string"){
if(func2(data3) > 2048){
const err12 = {instancePath:instancePath+"/reason",schemaPath:"#/$defs/nonEmptyText/maxLength",keyword:"maxLength",params:{limit: 2048},message:"must NOT have more than 2048 characters"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(func2(data3) < 1){
const err13 = {instancePath:instancePath+"/reason",schemaPath:"#/$defs/nonEmptyText/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(!pattern22.test(data3)){
const err14 = {instancePath:instancePath+"/reason",schemaPath:"#/$defs/nonEmptyText/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]*\\S[^\\u0000-\\u001f\\u007f]*$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]*\\S[^\\u0000-\\u001f\\u007f]*$"+"\""};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
else {
const err15 = {instancePath:instancePath+"/reason",schemaPath:"#/$defs/nonEmptyText/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.extended_lessons !== undefined){
let data4 = data.extended_lessons;
if(Array.isArray(data4)){
if(data4.length > 8){
const err16 = {instancePath:instancePath+"/extended_lessons",schemaPath:"#/properties/extended_lessons/maxItems",keyword:"maxItems",params:{limit: 8},message:"must NOT have more than 8 items"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
const len1 = data4.length;
for(let i2=0; i2<len1; i2++){
let data5 = data4[i2];
if(typeof data5 === "string"){
if(func2(data5) > 1024){
const err17 = {instancePath:instancePath+"/extended_lessons/" + i2,schemaPath:"#/properties/extended_lessons/items/maxLength",keyword:"maxLength",params:{limit: 1024},message:"must NOT have more than 1024 characters"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(func2(data5) < 1){
const err18 = {instancePath:instancePath+"/extended_lessons/" + i2,schemaPath:"#/properties/extended_lessons/items/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(!pattern22.test(data5)){
const err19 = {instancePath:instancePath+"/extended_lessons/" + i2,schemaPath:"#/properties/extended_lessons/items/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]*\\S[^\\u0000-\\u001f\\u007f]*$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]*\\S[^\\u0000-\\u001f\\u007f]*$"+"\""};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
else {
const err20 = {instancePath:instancePath+"/extended_lessons/" + i2,schemaPath:"#/properties/extended_lessons/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
else {
const err21 = {instancePath:instancePath+"/extended_lessons",schemaPath:"#/properties/extended_lessons/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
}
else {
const err22 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
validate42.errors = vErrors;
return errors === 0;
}
validate42.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate35(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate35.evaluated;
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
if((data.kind === undefined) && (missing0 = "kind")){
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
if(data.kind !== undefined){
if("create" !== data.kind){
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
if(_valid0){
const _errs5 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.target !== undefined){
let data1 = data.target;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.expected !== undefined){
let data2 = data1.expected;
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.absent === undefined){
const err2 = {instancePath:instancePath+"/target/expected",schemaPath:"#/allOf/0/then/properties/target/properties/expected/required",keyword:"required",params:{missingProperty: "absent"},message:"must have required property '"+"absent"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
}
}
}
}
var _valid0 = _errs5 === errors;
valid1 = _valid0;
if(valid1){
var props0 = {};
props0.target = true;
props0.kind = true;
}
}
if(!valid1){
const err3 = {instancePath,schemaPath:"#/allOf/0/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
const _errs9 = errors;
let valid5 = true;
const _errs10 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing1;
if((data.kind === undefined) && (missing1 = "kind")){
const err4 = {};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
else {
if(data.kind !== undefined){
let data3 = data.kind;
if(!(((data3 === "update") || (data3 === "merge")) || (data3 === "supersede"))){
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
}
}
var _valid1 = _errs10 === errors;
errors = _errs9;
if(vErrors !== null){
if(_errs9){
vErrors.length = _errs9;
}
else {
vErrors = null;
}
}
if(_valid1){
const _errs12 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.target !== undefined){
let data4 = data.target;
if(data4 && typeof data4 == "object" && !Array.isArray(data4)){
if(data4.expected !== undefined){
let data5 = data4.expected;
if(data5 && typeof data5 == "object" && !Array.isArray(data5)){
if(data5.sha256 === undefined){
const err6 = {instancePath:instancePath+"/target/expected",schemaPath:"#/allOf/1/then/properties/target/properties/expected/required",keyword:"required",params:{missingProperty: "sha256"},message:"must have required property '"+"sha256"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
}
}
}
}
var _valid1 = _errs12 === errors;
valid5 = _valid1;
if(valid5){
var props1 = {};
props1.target = true;
props1.kind = true;
}
}
if(!valid5){
const err7 = {instancePath,schemaPath:"#/allOf/1/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
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
const _errs16 = errors;
let valid9 = true;
const _errs17 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing2;
if((data.kind === undefined) && (missing2 = "kind")){
const err8 = {};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
else {
if(data.kind !== undefined){
if("merge" !== data.kind){
const err9 = {};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
}
}
var _valid2 = _errs17 === errors;
errors = _errs16;
if(vErrors !== null){
if(_errs16){
vErrors.length = _errs16;
}
else {
vErrors = null;
}
}
let ifClause0;
if(_valid2){
const _errs19 = errors;
const _errs20 = errors;
const _errs21 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing3;
if((data.deprecation === undefined) && (missing3 = "deprecation")){
const err10 = {};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
var valid11 = _errs21 === errors;
if(valid11){
const err11 = {instancePath,schemaPath:"#/allOf/2/then/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
else {
errors = _errs20;
if(vErrors !== null){
if(_errs20){
vErrors.length = _errs20;
}
else {
vErrors = null;
}
}
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.source_concept_ids === undefined){
const err12 = {instancePath,schemaPath:"#/allOf/2/then/required",keyword:"required",params:{missingProperty: "source_concept_ids"},message:"must have required property '"+"source_concept_ids"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
var _valid2 = _errs19 === errors;
valid9 = _valid2;
ifClause0 = "then";
}
else {
const _errs22 = errors;
const _errs23 = errors;
const _errs24 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing4;
if((data.source_concept_ids === undefined) && (missing4 = "source_concept_ids")){
const err13 = {};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
var valid12 = _errs24 === errors;
if(valid12){
const err14 = {instancePath,schemaPath:"#/allOf/2/else/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
else {
errors = _errs23;
if(vErrors !== null){
if(_errs23){
vErrors.length = _errs23;
}
else {
vErrors = null;
}
}
}
var _valid2 = _errs22 === errors;
valid9 = _valid2;
ifClause0 = "else";
}
if(!valid9){
const err15 = {instancePath,schemaPath:"#/allOf/2/if",keyword:"if",params:{failingKeyword: ifClause0},message:"must match \""+ifClause0+"\" schema"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(props0 !== true){
props0 = props0 || {};
props0.kind = true;
}
const _errs26 = errors;
let valid13 = true;
const _errs27 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing5;
if((data.kind === undefined) && (missing5 = "kind")){
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
if(data.kind !== undefined){
if("supersede" !== data.kind){
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
var _valid3 = _errs27 === errors;
errors = _errs26;
if(vErrors !== null){
if(_errs26){
vErrors.length = _errs26;
}
else {
vErrors = null;
}
}
let ifClause1;
if(_valid3){
const _errs29 = errors;
const _errs30 = errors;
const _errs31 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing6;
if((data.source_concept_ids === undefined) && (missing6 = "source_concept_ids")){
const err18 = {};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
var valid15 = _errs31 === errors;
if(valid15){
const err19 = {instancePath,schemaPath:"#/allOf/3/then/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
else {
errors = _errs30;
if(vErrors !== null){
if(_errs30){
vErrors.length = _errs30;
}
else {
vErrors = null;
}
}
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.deprecation === undefined){
const err20 = {instancePath,schemaPath:"#/allOf/3/then/required",keyword:"required",params:{missingProperty: "deprecation"},message:"must have required property '"+"deprecation"+"'"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
var _valid3 = _errs29 === errors;
valid13 = _valid3;
ifClause1 = "then";
}
else {
const _errs32 = errors;
const _errs33 = errors;
const _errs34 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing7;
if((data.deprecation === undefined) && (missing7 = "deprecation")){
const err21 = {};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
var valid16 = _errs34 === errors;
if(valid16){
const err22 = {instancePath,schemaPath:"#/allOf/3/else/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
else {
errors = _errs33;
if(vErrors !== null){
if(_errs33){
vErrors.length = _errs33;
}
else {
vErrors = null;
}
}
}
var _valid3 = _errs32 === errors;
valid13 = _valid3;
ifClause1 = "else";
}
if(!valid13){
const err23 = {instancePath,schemaPath:"#/allOf/3/if",keyword:"if",params:{failingKeyword: ifClause1},message:"must match \""+ifClause1+"\" schema"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(props0 !== true){
props0 = props0 || {};
props0.kind = true;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.operation_id === undefined){
const err24 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "operation_id"},message:"must have required property '"+"operation_id"+"'"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(data.sequence === undefined){
const err25 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sequence"},message:"must have required property '"+"sequence"+"'"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(data.kind === undefined){
const err26 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(data.capture_ids === undefined){
const err27 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "capture_ids"},message:"must have required property '"+"capture_ids"+"'"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(data.depends_on === undefined){
const err28 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "depends_on"},message:"must have required property '"+"depends_on"+"'"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(data.idempotency_key === undefined){
const err29 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "idempotency_key"},message:"must have required property '"+"idempotency_key"+"'"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(data.target === undefined){
const err30 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "target"},message:"must have required property '"+"target"+"'"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if(data.change === undefined){
const err31 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "change"},message:"must have required property '"+"change"+"'"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if(data.claims === undefined){
const err32 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "claims"},message:"must have required property '"+"claims"+"'"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
for(const key0 in data){
if(!(func1.call(schema63.properties, key0))){
const err33 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data.operation_id !== undefined){
let data8 = data.operation_id;
if(typeof data8 === "string"){
if(!pattern18.test(data8)){
const err34 = {instancePath:instancePath+"/operation_id",schemaPath:"#/$defs/operationId/pattern",keyword:"pattern",params:{pattern: "^op-[a-z0-9][a-z0-9._-]{0,79}$"},message:"must match pattern \""+"^op-[a-z0-9][a-z0-9._-]{0,79}$"+"\""};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
else {
const err35 = {instancePath:instancePath+"/operation_id",schemaPath:"#/$defs/operationId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data.sequence !== undefined){
let data9 = data.sequence;
if(!((typeof data9 == "number") && (!(data9 % 1) && !isNaN(data9)))){
const err36 = {instancePath:instancePath+"/sequence",schemaPath:"#/properties/sequence/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(typeof data9 == "number"){
if(data9 < 1 || isNaN(data9)){
const err37 = {instancePath:instancePath+"/sequence",schemaPath:"#/properties/sequence/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.kind !== undefined){
let data10 = data.kind;
if(typeof data10 !== "string"){
const err38 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(!((((data10 === "create") || (data10 === "update")) || (data10 === "merge")) || (data10 === "supersede"))){
const err39 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/enum",keyword:"enum",params:{allowedValues: schema63.properties.kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
if(data.capture_ids !== undefined){
let data11 = data.capture_ids;
if(Array.isArray(data11)){
if(data11.length > 128){
const err40 = {instancePath:instancePath+"/capture_ids",schemaPath:"#/properties/capture_ids/maxItems",keyword:"maxItems",params:{limit: 128},message:"must NOT have more than 128 items"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(data11.length < 1){
const err41 = {instancePath:instancePath+"/capture_ids",schemaPath:"#/properties/capture_ids/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
const len0 = data11.length;
for(let i0=0; i0<len0; i0++){
let data12 = data11[i0];
if(typeof data12 === "string"){
if(!pattern15.test(data12)){
const err42 = {instancePath:instancePath+"/capture_ids/" + i0,schemaPath:"#/$defs/captureId/pattern",keyword:"pattern",params:{pattern: "^cap-[a-z0-9][a-z0-9._-]{0,79}$"},message:"must match pattern \""+"^cap-[a-z0-9][a-z0-9._-]{0,79}$"+"\""};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
else {
const err43 = {instancePath:instancePath+"/capture_ids/" + i0,schemaPath:"#/$defs/captureId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
let i1 = data11.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data11[i1], data11[j0])){
const err44 = {instancePath:instancePath+"/capture_ids",schemaPath:"#/properties/capture_ids/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err45 = {instancePath:instancePath+"/capture_ids",schemaPath:"#/properties/capture_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
if(data.depends_on !== undefined){
let data13 = data.depends_on;
if(Array.isArray(data13)){
if(data13.length > 32){
const err46 = {instancePath:instancePath+"/depends_on",schemaPath:"#/properties/depends_on/maxItems",keyword:"maxItems",params:{limit: 32},message:"must NOT have more than 32 items"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
const len1 = data13.length;
for(let i2=0; i2<len1; i2++){
let data14 = data13[i2];
if(typeof data14 === "string"){
if(!pattern18.test(data14)){
const err47 = {instancePath:instancePath+"/depends_on/" + i2,schemaPath:"#/$defs/operationId/pattern",keyword:"pattern",params:{pattern: "^op-[a-z0-9][a-z0-9._-]{0,79}$"},message:"must match pattern \""+"^op-[a-z0-9][a-z0-9._-]{0,79}$"+"\""};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
else {
const err48 = {instancePath:instancePath+"/depends_on/" + i2,schemaPath:"#/$defs/operationId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
}
let i3 = data13.length;
let j1;
if(i3 > 1){
outer1:
for(;i3--;){
for(j1 = i3; j1--;){
if(func0(data13[i3], data13[j1])){
const err49 = {instancePath:instancePath+"/depends_on",schemaPath:"#/properties/depends_on/uniqueItems",keyword:"uniqueItems",params:{i: i3, j: j1},message:"must NOT have duplicate items (items ## "+j1+" and "+i3+" are identical)"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
break outer1;
}
}
}
}
}
else {
const err50 = {instancePath:instancePath+"/depends_on",schemaPath:"#/properties/depends_on/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
}
if(data.idempotency_key !== undefined){
let data15 = data.idempotency_key;
if(typeof data15 === "string"){
if(!pattern17.test(data15)){
const err51 = {instancePath:instancePath+"/idempotency_key",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
else {
const err52 = {instancePath:instancePath+"/idempotency_key",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
if(data.target !== undefined){
if(!(validate36(data.target, {instancePath:instancePath+"/target",parentData:data,parentDataProperty:"target",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate36.errors : vErrors.concat(validate36.errors);
errors = vErrors.length;
}
}
if(data.change !== undefined){
if(!(validate38(data.change, {instancePath:instancePath+"/change",parentData:data,parentDataProperty:"change",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate38.errors : vErrors.concat(validate38.errors);
errors = vErrors.length;
}
}
if(data.claims !== undefined){
let data18 = data.claims;
if(Array.isArray(data18)){
if(data18.length > 8){
const err53 = {instancePath:instancePath+"/claims",schemaPath:"#/properties/claims/maxItems",keyword:"maxItems",params:{limit: 8},message:"must NOT have more than 8 items"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if(data18.length < 1){
const err54 = {instancePath:instancePath+"/claims",schemaPath:"#/properties/claims/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
const len2 = data18.length;
for(let i4=0; i4<len2; i4++){
if(!(validate40(data18[i4], {instancePath:instancePath+"/claims/" + i4,parentData:data18,parentDataProperty:i4,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate40.errors : vErrors.concat(validate40.errors);
errors = vErrors.length;
}
}
}
else {
const err55 = {instancePath:instancePath+"/claims",schemaPath:"#/properties/claims/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
}
if(data.source_concept_ids !== undefined){
let data20 = data.source_concept_ids;
if(Array.isArray(data20)){
if(data20.length > 128){
const err56 = {instancePath:instancePath+"/source_concept_ids",schemaPath:"#/properties/source_concept_ids/maxItems",keyword:"maxItems",params:{limit: 128},message:"must NOT have more than 128 items"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
if(data20.length < 2){
const err57 = {instancePath:instancePath+"/source_concept_ids",schemaPath:"#/properties/source_concept_ids/minItems",keyword:"minItems",params:{limit: 2},message:"must NOT have fewer than 2 items"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
const len3 = data20.length;
for(let i5=0; i5<len3; i5++){
let data21 = data20[i5];
if(typeof data21 === "string"){
if(!pattern24.test(data21)){
const err58 = {instancePath:instancePath+"/source_concept_ids/" + i5,schemaPath:"#/$defs/conceptId/pattern",keyword:"pattern",params:{pattern: "^okf-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^okf-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
}
else {
const err59 = {instancePath:instancePath+"/source_concept_ids/" + i5,schemaPath:"#/$defs/conceptId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
}
let i6 = data20.length;
let j2;
if(i6 > 1){
outer2:
for(;i6--;){
for(j2 = i6; j2--;){
if(func0(data20[i6], data20[j2])){
const err60 = {instancePath:instancePath+"/source_concept_ids",schemaPath:"#/properties/source_concept_ids/uniqueItems",keyword:"uniqueItems",params:{i: i6, j: j2},message:"must NOT have duplicate items (items ## "+j2+" and "+i6+" are identical)"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
break outer2;
}
}
}
}
}
else {
const err61 = {instancePath:instancePath+"/source_concept_ids",schemaPath:"#/properties/source_concept_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
}
if(data.deprecation !== undefined){
if(!(validate42(data.deprecation, {instancePath:instancePath+"/deprecation",parentData:data,parentDataProperty:"deprecation",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate42.errors : vErrors.concat(validate42.errors);
errors = vErrors.length;
}
}
}
else {
const err62 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
validate35.errors = vErrors;
return errors === 0;
}
validate35.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema82 = {"type":"object","additionalProperties":false,"required":["evidence_id","kind","locator","sha256","independence","produced_by","produced_at","authority_ref"],"properties":{"evidence_id":{"$ref":"#/$defs/evidenceId"},"kind":{"type":"string","enum":["test","receipt","review","source","commit","operator-approval"]},"locator":{"type":"string","minLength":1,"maxLength":1024},"sha256":{"$ref":"#/$defs/sha256"},"independence":{"type":"string","enum":["author","independent"]},"redacted":{"type":"boolean"},"produced_by":{"type":"string","minLength":1,"maxLength":256},"produced_at":{"$ref":"#/$defs/utcTimestamp"},"authority_ref":{"type":"string","minLength":1,"maxLength":1024}}};

function validate45(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate45.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.evidence_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "evidence_id"},message:"must have required property '"+"evidence_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.kind === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.locator === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "locator"},message:"must have required property '"+"locator"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.sha256 === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sha256"},message:"must have required property '"+"sha256"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.independence === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "independence"},message:"must have required property '"+"independence"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.produced_by === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "produced_by"},message:"must have required property '"+"produced_by"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.produced_at === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "produced_at"},message:"must have required property '"+"produced_at"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.authority_ref === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "authority_ref"},message:"must have required property '"+"authority_ref"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
for(const key0 in data){
if(!(func1.call(schema82.properties, key0))){
const err8 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.evidence_id !== undefined){
let data0 = data.evidence_id;
if(typeof data0 === "string"){
if(!pattern38.test(data0)){
const err9 = {instancePath:instancePath+"/evidence_id",schemaPath:"#/$defs/evidenceId/pattern",keyword:"pattern",params:{pattern: "^ev-[a-z0-9][a-z0-9._-]{0,79}$"},message:"must match pattern \""+"^ev-[a-z0-9][a-z0-9._-]{0,79}$"+"\""};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
else {
const err10 = {instancePath:instancePath+"/evidence_id",schemaPath:"#/$defs/evidenceId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.kind !== undefined){
let data1 = data.kind;
if(typeof data1 !== "string"){
const err11 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(!((((((data1 === "test") || (data1 === "receipt")) || (data1 === "review")) || (data1 === "source")) || (data1 === "commit")) || (data1 === "operator-approval"))){
const err12 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/enum",keyword:"enum",params:{allowedValues: schema82.properties.kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.locator !== undefined){
let data2 = data.locator;
if(typeof data2 === "string"){
if(func2(data2) > 1024){
const err13 = {instancePath:instancePath+"/locator",schemaPath:"#/properties/locator/maxLength",keyword:"maxLength",params:{limit: 1024},message:"must NOT have more than 1024 characters"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(func2(data2) < 1){
const err14 = {instancePath:instancePath+"/locator",schemaPath:"#/properties/locator/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
else {
const err15 = {instancePath:instancePath+"/locator",schemaPath:"#/properties/locator/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.sha256 !== undefined){
let data3 = data.sha256;
if(typeof data3 === "string"){
if(!pattern17.test(data3)){
const err16 = {instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
else {
const err17 = {instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.independence !== undefined){
let data4 = data.independence;
if(typeof data4 !== "string"){
const err18 = {instancePath:instancePath+"/independence",schemaPath:"#/properties/independence/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(!((data4 === "author") || (data4 === "independent"))){
const err19 = {instancePath:instancePath+"/independence",schemaPath:"#/properties/independence/enum",keyword:"enum",params:{allowedValues: schema82.properties.independence.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.redacted !== undefined){
if(typeof data.redacted !== "boolean"){
const err20 = {instancePath:instancePath+"/redacted",schemaPath:"#/properties/redacted/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data.produced_by !== undefined){
let data6 = data.produced_by;
if(typeof data6 === "string"){
if(func2(data6) > 256){
const err21 = {instancePath:instancePath+"/produced_by",schemaPath:"#/properties/produced_by/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(func2(data6) < 1){
const err22 = {instancePath:instancePath+"/produced_by",schemaPath:"#/properties/produced_by/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
else {
const err23 = {instancePath:instancePath+"/produced_by",schemaPath:"#/properties/produced_by/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.produced_at !== undefined){
let data7 = data.produced_at;
if(typeof data7 === "string"){
if(!pattern8.test(data7)){
const err24 = {instancePath:instancePath+"/produced_at",schemaPath:"#/$defs/utcTimestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"+"\""};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
else {
const err25 = {instancePath:instancePath+"/produced_at",schemaPath:"#/$defs/utcTimestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.authority_ref !== undefined){
let data8 = data.authority_ref;
if(typeof data8 === "string"){
if(func2(data8) > 1024){
const err26 = {instancePath:instancePath+"/authority_ref",schemaPath:"#/properties/authority_ref/maxLength",keyword:"maxLength",params:{limit: 1024},message:"must NOT have more than 1024 characters"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(func2(data8) < 1){
const err27 = {instancePath:instancePath+"/authority_ref",schemaPath:"#/properties/authority_ref/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
else {
const err28 = {instancePath:instancePath+"/authority_ref",schemaPath:"#/properties/authority_ref/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
}
else {
const err29 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
validate45.errors = vErrors;
return errors === 0;
}
validate45.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema86 = {"type":"object","additionalProperties":false,"required":["selector","manifest_path","manifest_sha256","required_capture_ids"],"properties":{"selector":{"const":"explicit"},"manifest_path":{"$ref":"#/$defs/relativePath"},"manifest_sha256":{"$ref":"#/$defs/sha256"},"required_capture_ids":{"type":"array","minItems":1,"uniqueItems":true,"items":{"$ref":"#/$defs/captureId"},"maxItems":128}}};

function validate47(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate47.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.selector === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "selector"},message:"must have required property '"+"selector"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.manifest_path === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "manifest_path"},message:"must have required property '"+"manifest_path"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.manifest_sha256 === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "manifest_sha256"},message:"must have required property '"+"manifest_sha256"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.required_capture_ids === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "required_capture_ids"},message:"must have required property '"+"required_capture_ids"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "selector") || (key0 === "manifest_path")) || (key0 === "manifest_sha256")) || (key0 === "required_capture_ids"))){
const err4 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.selector !== undefined){
if("explicit" !== data.selector){
const err5 = {instancePath:instancePath+"/selector",schemaPath:"#/properties/selector/const",keyword:"const",params:{allowedValue: "explicit"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.manifest_path !== undefined){
let data1 = data.manifest_path;
if(typeof data1 === "string"){
if(func2(data1) > 1024){
const err6 = {instancePath:instancePath+"/manifest_path",schemaPath:"#/$defs/relativePath/maxLength",keyword:"maxLength",params:{limit: 1024},message:"must NOT have more than 1024 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(func2(data1) < 1){
const err7 = {instancePath:instancePath+"/manifest_path",schemaPath:"#/$defs/relativePath/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!pattern16.test(data1)){
const err8 = {instancePath:instancePath+"/manifest_path",schemaPath:"#/$defs/relativePath/pattern",keyword:"pattern",params:{pattern: "^(?!/)(?![A-Za-z][A-Za-z0-9+.-]*:)(?!.*\\\\)(?!.*[\\u0000-\\u001f\\u007f])(?!.*//)(?!.*(?:^|/)\\.\\.?(?:/|$))(?!.*\\/$)[^\\u0000]+$"},message:"must match pattern \""+"^(?!/)(?![A-Za-z][A-Za-z0-9+.-]*:)(?!.*\\\\)(?!.*[\\u0000-\\u001f\\u007f])(?!.*//)(?!.*(?:^|/)\\.\\.?(?:/|$))(?!.*\\/$)[^\\u0000]+$"+"\""};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
else {
const err9 = {instancePath:instancePath+"/manifest_path",schemaPath:"#/$defs/relativePath/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.manifest_sha256 !== undefined){
let data2 = data.manifest_sha256;
if(typeof data2 === "string"){
if(!pattern17.test(data2)){
const err10 = {instancePath:instancePath+"/manifest_sha256",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
else {
const err11 = {instancePath:instancePath+"/manifest_sha256",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.required_capture_ids !== undefined){
let data3 = data.required_capture_ids;
if(Array.isArray(data3)){
if(data3.length > 128){
const err12 = {instancePath:instancePath+"/required_capture_ids",schemaPath:"#/properties/required_capture_ids/maxItems",keyword:"maxItems",params:{limit: 128},message:"must NOT have more than 128 items"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data3.length < 1){
const err13 = {instancePath:instancePath+"/required_capture_ids",schemaPath:"#/properties/required_capture_ids/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
const len0 = data3.length;
for(let i0=0; i0<len0; i0++){
let data4 = data3[i0];
if(typeof data4 === "string"){
if(!pattern15.test(data4)){
const err14 = {instancePath:instancePath+"/required_capture_ids/" + i0,schemaPath:"#/$defs/captureId/pattern",keyword:"pattern",params:{pattern: "^cap-[a-z0-9][a-z0-9._-]{0,79}$"},message:"must match pattern \""+"^cap-[a-z0-9][a-z0-9._-]{0,79}$"+"\""};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
else {
const err15 = {instancePath:instancePath+"/required_capture_ids/" + i0,schemaPath:"#/$defs/captureId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
let i1 = data3.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data3[i1], data3[j0])){
const err16 = {instancePath:instancePath+"/required_capture_ids",schemaPath:"#/properties/required_capture_ids/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err17 = {instancePath:instancePath+"/required_capture_ids",schemaPath:"#/properties/required_capture_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
else {
const err18 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
validate47.errors = vErrors;
return errors === 0;
}
validate47.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema90 = {"type":"object","additionalProperties":false,"required":["title","description","tags","commit_shas","issue_refs","epic_refs"],"properties":{"title":{"type":"string","minLength":1,"maxLength":256,"pattern":"^(?=.*\\S)[^\\r\\n]+$"},"description":{"type":"string","minLength":1,"maxLength":512,"pattern":"^(?=.*\\S)[^\\r\\n]+$"},"tags":{"type":"array","minItems":1,"maxItems":32,"uniqueItems":true,"items":{"type":"string","pattern":"^[a-z0-9]+(?:[./-][a-z0-9]+)*$"}},"commit_shas":{"type":"array","minItems":1,"maxItems":128,"uniqueItems":true,"items":{"$ref":"#/$defs/gitObject"}},"issue_refs":{"type":"array","maxItems":128,"uniqueItems":true,"items":{"type":"integer","minimum":1}},"epic_refs":{"type":"array","maxItems":32,"uniqueItems":true,"items":{"type":"integer","minimum":1}}}};
const pattern52 = new RegExp("^[a-z0-9]+(?:[./-][a-z0-9]+)*$", "u");

function validate49(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate49.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.title === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "title"},message:"must have required property '"+"title"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.description === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "description"},message:"must have required property '"+"description"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.tags === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "tags"},message:"must have required property '"+"tags"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.commit_shas === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "commit_shas"},message:"must have required property '"+"commit_shas"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.issue_refs === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "issue_refs"},message:"must have required property '"+"issue_refs"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.epic_refs === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "epic_refs"},message:"must have required property '"+"epic_refs"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "title") || (key0 === "description")) || (key0 === "tags")) || (key0 === "commit_shas")) || (key0 === "issue_refs")) || (key0 === "epic_refs"))){
const err6 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.title !== undefined){
let data0 = data.title;
if(typeof data0 === "string"){
if(func2(data0) > 256){
const err7 = {instancePath:instancePath+"/title",schemaPath:"#/properties/title/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(func2(data0) < 1){
const err8 = {instancePath:instancePath+"/title",schemaPath:"#/properties/title/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(!pattern11.test(data0)){
const err9 = {instancePath:instancePath+"/title",schemaPath:"#/properties/title/pattern",keyword:"pattern",params:{pattern: "^(?=.*\\S)[^\\r\\n]+$"},message:"must match pattern \""+"^(?=.*\\S)[^\\r\\n]+$"+"\""};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
else {
const err10 = {instancePath:instancePath+"/title",schemaPath:"#/properties/title/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.description !== undefined){
let data1 = data.description;
if(typeof data1 === "string"){
if(func2(data1) > 512){
const err11 = {instancePath:instancePath+"/description",schemaPath:"#/properties/description/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(func2(data1) < 1){
const err12 = {instancePath:instancePath+"/description",schemaPath:"#/properties/description/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(!pattern11.test(data1)){
const err13 = {instancePath:instancePath+"/description",schemaPath:"#/properties/description/pattern",keyword:"pattern",params:{pattern: "^(?=.*\\S)[^\\r\\n]+$"},message:"must match pattern \""+"^(?=.*\\S)[^\\r\\n]+$"+"\""};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
else {
const err14 = {instancePath:instancePath+"/description",schemaPath:"#/properties/description/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.tags !== undefined){
let data2 = data.tags;
if(Array.isArray(data2)){
if(data2.length > 32){
const err15 = {instancePath:instancePath+"/tags",schemaPath:"#/properties/tags/maxItems",keyword:"maxItems",params:{limit: 32},message:"must NOT have more than 32 items"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data2.length < 1){
const err16 = {instancePath:instancePath+"/tags",schemaPath:"#/properties/tags/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
const len0 = data2.length;
for(let i0=0; i0<len0; i0++){
let data3 = data2[i0];
if(typeof data3 === "string"){
if(!pattern52.test(data3)){
const err17 = {instancePath:instancePath+"/tags/" + i0,schemaPath:"#/properties/tags/items/pattern",keyword:"pattern",params:{pattern: "^[a-z0-9]+(?:[./-][a-z0-9]+)*$"},message:"must match pattern \""+"^[a-z0-9]+(?:[./-][a-z0-9]+)*$"+"\""};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
else {
const err18 = {instancePath:instancePath+"/tags/" + i0,schemaPath:"#/properties/tags/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
let i1 = data2.length;
let j0;
if(i1 > 1){
const indices0 = {};
for(;i1--;){
let item0 = data2[i1];
if(typeof item0 !== "string"){
continue;
}
if(typeof indices0[item0] == "number"){
j0 = indices0[item0];
const err19 = {instancePath:instancePath+"/tags",schemaPath:"#/properties/tags/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
break;
}
indices0[item0] = i1;
}
}
}
else {
const err20 = {instancePath:instancePath+"/tags",schemaPath:"#/properties/tags/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data.commit_shas !== undefined){
let data4 = data.commit_shas;
if(Array.isArray(data4)){
if(data4.length > 128){
const err21 = {instancePath:instancePath+"/commit_shas",schemaPath:"#/properties/commit_shas/maxItems",keyword:"maxItems",params:{limit: 128},message:"must NOT have more than 128 items"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(data4.length < 1){
const err22 = {instancePath:instancePath+"/commit_shas",schemaPath:"#/properties/commit_shas/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
const len1 = data4.length;
for(let i2=0; i2<len1; i2++){
let data5 = data4[i2];
if(typeof data5 === "string"){
if(!pattern6.test(data5)){
const err23 = {instancePath:instancePath+"/commit_shas/" + i2,schemaPath:"#/$defs/gitObject/pattern",keyword:"pattern",params:{pattern: "^(?:[0-9a-f]{40}|[0-9a-f]{64})$"},message:"must match pattern \""+"^(?:[0-9a-f]{40}|[0-9a-f]{64})$"+"\""};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
else {
const err24 = {instancePath:instancePath+"/commit_shas/" + i2,schemaPath:"#/$defs/gitObject/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
let i3 = data4.length;
let j1;
if(i3 > 1){
outer0:
for(;i3--;){
for(j1 = i3; j1--;){
if(func0(data4[i3], data4[j1])){
const err25 = {instancePath:instancePath+"/commit_shas",schemaPath:"#/properties/commit_shas/uniqueItems",keyword:"uniqueItems",params:{i: i3, j: j1},message:"must NOT have duplicate items (items ## "+j1+" and "+i3+" are identical)"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err26 = {instancePath:instancePath+"/commit_shas",schemaPath:"#/properties/commit_shas/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data.issue_refs !== undefined){
let data6 = data.issue_refs;
if(Array.isArray(data6)){
if(data6.length > 128){
const err27 = {instancePath:instancePath+"/issue_refs",schemaPath:"#/properties/issue_refs/maxItems",keyword:"maxItems",params:{limit: 128},message:"must NOT have more than 128 items"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
const len2 = data6.length;
for(let i4=0; i4<len2; i4++){
let data7 = data6[i4];
if(!((typeof data7 == "number") && (!(data7 % 1) && !isNaN(data7)))){
const err28 = {instancePath:instancePath+"/issue_refs/" + i4,schemaPath:"#/properties/issue_refs/items/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(typeof data7 == "number"){
if(data7 < 1 || isNaN(data7)){
const err29 = {instancePath:instancePath+"/issue_refs/" + i4,schemaPath:"#/properties/issue_refs/items/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
}
let i5 = data6.length;
let j2;
if(i5 > 1){
const indices1 = {};
for(;i5--;){
let item1 = data6[i5];
if(!((typeof item1 == "number") && (!(item1 % 1) && !isNaN(item1)))){
continue;
}
if(typeof indices1[item1] == "number"){
j2 = indices1[item1];
const err30 = {instancePath:instancePath+"/issue_refs",schemaPath:"#/properties/issue_refs/uniqueItems",keyword:"uniqueItems",params:{i: i5, j: j2},message:"must NOT have duplicate items (items ## "+j2+" and "+i5+" are identical)"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
break;
}
indices1[item1] = i5;
}
}
}
else {
const err31 = {instancePath:instancePath+"/issue_refs",schemaPath:"#/properties/issue_refs/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data.epic_refs !== undefined){
let data8 = data.epic_refs;
if(Array.isArray(data8)){
if(data8.length > 32){
const err32 = {instancePath:instancePath+"/epic_refs",schemaPath:"#/properties/epic_refs/maxItems",keyword:"maxItems",params:{limit: 32},message:"must NOT have more than 32 items"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
const len3 = data8.length;
for(let i6=0; i6<len3; i6++){
let data9 = data8[i6];
if(!((typeof data9 == "number") && (!(data9 % 1) && !isNaN(data9)))){
const err33 = {instancePath:instancePath+"/epic_refs/" + i6,schemaPath:"#/properties/epic_refs/items/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(typeof data9 == "number"){
if(data9 < 1 || isNaN(data9)){
const err34 = {instancePath:instancePath+"/epic_refs/" + i6,schemaPath:"#/properties/epic_refs/items/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
let i7 = data8.length;
let j3;
if(i7 > 1){
const indices2 = {};
for(;i7--;){
let item2 = data8[i7];
if(!((typeof item2 == "number") && (!(item2 % 1) && !isNaN(item2)))){
continue;
}
if(typeof indices2[item2] == "number"){
j3 = indices2[item2];
const err35 = {instancePath:instancePath+"/epic_refs",schemaPath:"#/properties/epic_refs/uniqueItems",keyword:"uniqueItems",params:{i: i7, j: j3},message:"must NOT have duplicate items (items ## "+j3+" and "+i7+" are identical)"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
break;
}
indices2[item2] = i7;
}
}
}
else {
const err36 = {instancePath:instancePath+"/epic_refs",schemaPath:"#/properties/epic_refs/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
}
else {
const err37 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
validate49.errors = vErrors;
return errors === 0;
}
validate49.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate20(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="https://openknowledgeformat.org/schema/okf-knowledge-change-1.schema.json" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate20.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.schema_version === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "schema_version"},message:"must have required property '"+"schema_version"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.change_set_id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "change_set_id"},message:"must have required property '"+"change_set_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.session === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "session"},message:"must have required property '"+"session"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.generated === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "generated"},message:"must have required property '"+"generated"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.inbox === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "inbox"},message:"must have required property '"+"inbox"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.summary === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "summary"},message:"must have required property '"+"summary"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.limits === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "limits"},message:"must have required property '"+"limits"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.capture_selection === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "capture_selection"},message:"must have required property '"+"capture_selection"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.captures === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "captures"},message:"must have required property '"+"captures"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.operations === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "operations"},message:"must have required property '"+"operations"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.evidence === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "evidence"},message:"must have required property '"+"evidence"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
for(const key0 in data){
if(!(func1.call(schema31.properties, key0))){
const err11 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.schema_version !== undefined){
if("okf-knowledge-change/1" !== data.schema_version){
const err12 = {instancePath:instancePath+"/schema_version",schemaPath:"#/properties/schema_version/const",keyword:"const",params:{allowedValue: "okf-knowledge-change/1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.change_set_id !== undefined){
let data1 = data.change_set_id;
if(typeof data1 === "string"){
if(!pattern4.test(data1)){
const err13 = {instancePath:instancePath+"/change_set_id",schemaPath:"#/$defs/changeSetId/pattern",keyword:"pattern",params:{pattern: "^ks-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^ks-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
else {
const err14 = {instancePath:instancePath+"/change_set_id",schemaPath:"#/$defs/changeSetId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.session !== undefined){
if(!(validate21(data.session, {instancePath:instancePath+"/session",parentData:data,parentDataProperty:"session",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate21.errors : vErrors.concat(validate21.errors);
errors = vErrors.length;
}
}
if(data.generated !== undefined){
if(!(validate23(data.generated, {instancePath:instancePath+"/generated",parentData:data,parentDataProperty:"generated",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate23.errors : vErrors.concat(validate23.errors);
errors = vErrors.length;
}
}
if(data.summary !== undefined){
if(!(validate25(data.summary, {instancePath:instancePath+"/summary",parentData:data,parentDataProperty:"summary",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate25.errors : vErrors.concat(validate25.errors);
errors = vErrors.length;
}
}
if(data.captures !== undefined){
let data5 = data.captures;
if(Array.isArray(data5)){
if(data5.length > 128){
const err15 = {instancePath:instancePath+"/captures",schemaPath:"#/properties/captures/maxItems",keyword:"maxItems",params:{limit: 128},message:"must NOT have more than 128 items"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data5.length < 1){
const err16 = {instancePath:instancePath+"/captures",schemaPath:"#/properties/captures/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
const len0 = data5.length;
for(let i0=0; i0<len0; i0++){
if(!(validate27(data5[i0], {instancePath:instancePath+"/captures/" + i0,parentData:data5,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate27.errors : vErrors.concat(validate27.errors);
errors = vErrors.length;
}
}
}
else {
const err17 = {instancePath:instancePath+"/captures",schemaPath:"#/properties/captures/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.operations !== undefined){
let data7 = data.operations;
if(Array.isArray(data7)){
if(data7.length > 32){
const err18 = {instancePath:instancePath+"/operations",schemaPath:"#/properties/operations/maxItems",keyword:"maxItems",params:{limit: 32},message:"must NOT have more than 32 items"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
const len1 = data7.length;
for(let i1=0; i1<len1; i1++){
if(!(validate35(data7[i1], {instancePath:instancePath+"/operations/" + i1,parentData:data7,parentDataProperty:i1,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate35.errors : vErrors.concat(validate35.errors);
errors = vErrors.length;
}
}
}
else {
const err19 = {instancePath:instancePath+"/operations",schemaPath:"#/properties/operations/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.evidence !== undefined){
let data9 = data.evidence;
if(Array.isArray(data9)){
if(data9.length > 128){
const err20 = {instancePath:instancePath+"/evidence",schemaPath:"#/properties/evidence/maxItems",keyword:"maxItems",params:{limit: 128},message:"must NOT have more than 128 items"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
const len2 = data9.length;
for(let i2=0; i2<len2; i2++){
if(!(validate45(data9[i2], {instancePath:instancePath+"/evidence/" + i2,parentData:data9,parentDataProperty:i2,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate45.errors : vErrors.concat(validate45.errors);
errors = vErrors.length;
}
}
}
else {
const err21 = {instancePath:instancePath+"/evidence",schemaPath:"#/properties/evidence/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.capture_selection !== undefined){
if(!(validate47(data.capture_selection, {instancePath:instancePath+"/capture_selection",parentData:data,parentDataProperty:"capture_selection",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate47.errors : vErrors.concat(validate47.errors);
errors = vErrors.length;
}
}
if(data.inbox !== undefined){
if(!(validate49(data.inbox, {instancePath:instancePath+"/inbox",parentData:data,parentDataProperty:"inbox",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate49.errors : vErrors.concat(validate49.errors);
errors = vErrors.length;
}
}
if(data.limits !== undefined){
let data13 = data.limits;
if(data13 && typeof data13 == "object" && !Array.isArray(data13)){
if(data13.max_input_bytes === undefined){
const err22 = {instancePath:instancePath+"/limits",schemaPath:"#/properties/limits/required",keyword:"required",params:{missingProperty: "max_input_bytes"},message:"must have required property '"+"max_input_bytes"+"'"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
for(const key1 in data13){
if(!(key1 === "max_input_bytes")){
const err23 = {instancePath:instancePath+"/limits",schemaPath:"#/properties/limits/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data13.max_input_bytes !== undefined){
if(16777216 !== data13.max_input_bytes){
const err24 = {instancePath:instancePath+"/limits/max_input_bytes",schemaPath:"#/properties/limits/properties/max_input_bytes/const",keyword:"const",params:{allowedValue: 16777216},message:"must be equal to constant"};
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
else {
const err25 = {instancePath:instancePath+"/limits",schemaPath:"#/properties/limits/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
}
else {
const err26 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
validate20.errors = vErrors;
return errors === 0;
}
validate20.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};
