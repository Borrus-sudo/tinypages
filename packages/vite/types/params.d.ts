type IsParameter<Part> = Part extends `[${infer ParamName}]`
  ? ParamName
  : never;
type FilteredParts<Path> = Path extends `${infer PartA}/${infer PartB}`
  ? IsParameter<PartA> | FilteredParts<PartB>
  : IsParameter<Path>;
type ParamValue<Key> = Key extends `...${infer Anything}` ? string[] : number;
type RemovePrefixDots<Key> = Key extends `...${infer Name}` ? Name : Key;
type Params<Path> = {
  [Key in FilteredParts<Path> as RemovePrefixDots<Key>]: ParamValue<Key>;
};

export { Params };
