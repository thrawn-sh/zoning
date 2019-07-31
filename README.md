# Getting started
1. install python dependencies
    ```sh
    $> pipenv install
    ```
1. generate application data
    ```sh
    $> pipenv run bin/generate-api.py
    ```
1. install node dependencies
    ```sh
    $> npm install
    ```
1. build applcation
    ```sh
    $> npm build
    ```
1. test application
    ```sh
    $> npm serve
    ```
1. release application
    ```sh
    $> npm release
    ```

# Zone update
1. after updating the zone.kmz update the neighbour relationship (assets/neighbours.csv)
    ```sh
    $> pipenv run bin/calculate-neighbours.py
    ```
1. regenerate application data
    ```sh
    $> pipenv run bin/generate-api.py
    ```

# Other usefull command
```sh
# manually compile typescript
$> npm run tsc
# check typescript
$> npm run tslint
# update node dependencies
$> npm run update-npm
```

Based of the https://www.suche-postleitzahl.org/ project.