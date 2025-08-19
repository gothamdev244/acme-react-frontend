# acme-react-frontend

This repository is part of the ACME Contact Platform.

## Bundle Management

This repository includes its source bundle and scripts for bundle management:

- `bundle.txt` - The text bundle containing all project files
- `recreate_from_bundle.py` - Script to recreate the project from the bundle
- `update_bundle.py` - Script to update the bundle from current files

### Recreate Project from Bundle

```bash
python3 recreate_from_bundle.py bundle.txt .
```

### Update Bundle from Current Files

```bash
python3 update_bundle.py . bundle.txt
```

## Development

See the main documentation for development instructions specific to this component.
