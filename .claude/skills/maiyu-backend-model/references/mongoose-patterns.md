# Mongoose Advanced Patterns

## Sub-Schemas

Use sub-schemas for embedded documents (fields within fields):

```typescript
const AddressSchema = new mongoose.Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'BR' },
  },
  { _id: false },
);

const Schema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },
    address: { type: AddressSchema },
    addresses: [{ type: AddressSchema }],
    trashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    id: false,
  },
);
```

## Field Groups (Dynamic Sub-Schemas)

For flexible field configurations (like the reference project's table fields):

```typescript
const FieldSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    label: { type: String, required: true },
    slug: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(E_FIELD_TYPE),
      required: true,
    },
    format: {
      type: String,
      enum: Object.values(E_FIELD_FORMAT),
    },
    required: { type: Boolean, default: false },
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    options: [{ type: String }],
    relationship: {
      table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
      displayField: { type: String },
    },
    trashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);
```

## Complex Validators

### Custom validation within schema:

```typescript
const Schema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    validate: {
      validator: function (v: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Enter a valid email',
    },
  },
  cpf: {
    type: String,
    validate: {
      validator: function (v: string) {
        return validateCPF(v);
      },
      message: 'Enter a valid CPF',
    },
  },
});
```

### Unique compound indexes:

```typescript
Schema.index({ email: 1 }, { unique: true });
Schema.index({ slug: 1, group: 1 }, { unique: true });
Schema.index({ name: 'text', description: 'text' });
```

## Virtual Fields

```typescript
Schema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

Schema.set('toJSON', { virtuals: true, flattenObjectIds: true });
Schema.set('toObject', { virtuals: true });
```

## Pre/Post Hooks

```typescript
Schema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

Schema.post('save', function (doc) {
  console.log('%s has been saved', doc._id);
});
```

## Discriminators (Inheritance)

```typescript
const BaseSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, enum: ['article', 'video'] },
    title: { type: String, required: true },
  },
  { discriminatorKey: 'type', timestamps: true },
);

const Base = mongoose.model('Content', BaseSchema);

const ArticleSchema = new mongoose.Schema({
  body: { type: String, required: true },
  wordCount: { type: Number },
});

const Article = Base.discriminator('article', ArticleSchema);

const VideoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  duration: { type: Number },
});

const Video = Base.discriminator('video', VideoSchema);
```

## Population Patterns

```typescript
// Simple populate
const user = await User.findById(id).populate('group');

// Nested populate
const user = await User.findById(id).populate({
  path: 'group',
  populate: { path: 'permissions' },
});

// Multiple populate
const user = await User.findById(id)
  .populate('group')
  .populate('createdBy');

// Selective fields
const user = await User.findById(id)
  .populate('group', 'name slug');
```

## Aggregation Patterns

```typescript
// Lookup (join) with nested sort
const results = await Model.aggregate([
  { $match: where },
  {
    $lookup: {
      from: 'relatedcollection',
      localField: 'relatedId',
      foreignField: '_id',
      as: '_related',
    },
  },
  {
    $addFields: {
      _relatedName: { $arrayElemAt: ['$_related.name', 0] },
    },
  },
  { $sort: { _relatedName: 1 } },
  { $skip: skip },
  { $limit: limit },
  { $project: { _related: 0, _relatedName: 0 } },
]);
```
