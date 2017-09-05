# DIVAServices_Binarization_Example
Example visualizing different Binarization methods in JavaScript


The code in index.html is not complete and is meant to be a starting point for the following exercises:


## Task 1 - Testing the application

Open the index.html file with your favorite modern web browser (Edge, Firefox or Chrome).

Upload an image of your choosing using the "Choose File..." Button, and then binarize the image using "Otsu Binarization". Once the binarization is finished it will be displayed in your browser.

## Task 2 - Read some code

Open the index.html file with your favorite code/text editor. All important code can be found at the top of the file within the \<script\> tag.

Locate the `otsuBinarization` method, and read the code. This method starts the otsu binarization process on DIVAServices and polls for the result. The process for this is the following:

1. Generate POST request

    First the request body for the POST request is generated. The request body will look like this:

    ``` JSON
    {
            "parameters": {},
            "data": [
                {
                    "inputImage": identifier
                }
            ]
        }
    ```
    where `identifier` refers to the automatically generated identifier of the uploaded image.

2. Execute POST request.

    The POST request is sent to the URL of the otsu binarization method on DIVAServices with:

    ``` JavaScript
     fetch("http://divaservices.unifr.ch/api/v2/binarization/otsubinarization/1", {
            method: "POST",
            body: data,
            headers: new Headers({ 'content-type': 'application/json' })
        })
    ```

3. Process response and poll for results

    DIVAServices will response with data like this:
    ``` JSON
    {
	"results": [
      {
        "resultLink": "http://divaservices.unifr.ch/api/v2/results/teemingangelicprimate/data_0/data_0.json"
      }
    ],
    "collection": "teemingangelicprimate",
    "resultLink": "http://divaservices.unifr.ch/api/v2/results/teemingangelicprimate.json",
    "message": "This url is available for 24 hours",
    "status": "done",
    "statusCode": 202
    }
   ```
    This response is used in the `getResult(url)` method to poll every second to check if the result is computed. 


# Task 3 - Implement Sauvola and OCRopus Binarization

Using the information from above complete the two unfinished methods `sauvolaBinarization` and `ocropusBinarization`.

Hints:
 - The URL for sauvola binarization is: http://divaservices.unifr.ch/api/v2/binarization/sauvolabinarization/1
 - The URL for ocropus binarization is: http://divaservices.unifr.ch/api/v2/binarization/ocropusbinarization/1
 - The identifier to show the sauvola image is: `sauvola`
 - The identifier to show the ocropus image is: `ocropus`
 
# Task 4 - Implement DoG Binarization
The last Binarization method (DoG - Binarization) takes three additional parameters:
 - Threshold: A threshold that should be increased if too much noise is left over. 
 - Gauss1: A parameter that should be increased if large structures are not binarized well (e.g. thick strokes)
 - Gauss2:  A parameter that should be decreased if small structures are not binarized well (e.g. small fine strokes)

Implement the method `dogBinarization` such that it generates a POST request with a request body like this:

``` JSON
{
    "parameters": {
        "threshold": 0.1,
        "gauss1": 15,
        "gauss2": 1.5
    },
    "data": [
        {
            "inputImage": identifier
        }
    ]
}
```
Hints:
 - The values of the sliders can be access with `document.getElementById("...").value
 - The 'id's of the three sliders are `thresh_slider`, `gauss1_slider`, and `gauss2_slider`