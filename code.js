/*
    navigate to UKG - system configuration - service account administration  for the following inforamtion.
    On this page:
        1. User Name  (listed on the page if you have an existing account,first column of the table)
        2. API account password. (you can get this password from creating an service account  or getting it from IT if you have an existing account)
        3. Customer API Key (listed on the page, top left)
        4. User API Key (listed on the page, last column of the table)

    on this script:
        1. replace UserName,apipassword,Customer API Key,User API Key with the credentials. ---on function uKG_fetch_API_ReturnlogonSecret
        2. enter your spreadsheetid and Sheetname --- on function uKG_fetch_APIReportLIST
        3. search and replace yourhost with host name.  
            3.1: how to find your host name? 
                navigate to UKG - system configuration - web services; on  this page you will be able to see bunch of links.  between https://  and .ultipro.com/services/xxx is the host name.
    
    On Google work space:
        create a apps script project
        copy and past the following code
        on the left hand "Services" click  "+" Select  Google Sheets API, click add
        on the top of the page. Click Run.       

*/


async function uKG_fetch_APIReportLIST() {
    console.log("Task Started")
        //how to find your google sheet id?  copy the url of your google sheet.
        //https://docs.google.com/spreadsheets/d/this is the ID you need from the link/edit#gid=0
    const spreadsheetid = "enter your google spreadsheet id";
    const Sheetname = "enter your google sheetname";
    console.log("Getting UKG Log On Secret...")
    const data = await uKG_fetch_API_ReturnlogonSecret();
    if (data.responseCode == 200) {
        console.log("LogIn Sucessfully...")
        let getreportlist_XMLENVLOP = '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://www.w3.org/2005/08/addressing"> <s:Header> <a:Action s:mustUnderstand="1">http://www.ultipro.com/dataservices/bidata/2/IBIDataService/GetReportList</a:Action> <a:To s:mustUnderstand="1">https://yourhost.ultipro.com/services/BIDataService</a:To> </s:Header> <s:Body> <GetReportList xmlns="http://www.ultipro.com/dataservices/bidata/2"> <context xmlns:i="http://www.w3.org/2001/XMLSchema-instance">' + data.logonSecret + ' </context> </GetReportList> </s:Body> </s:Envelope>';
        const options2 = {
            method: 'POST',
            payload: getreportlist_XMLENVLOP,
            contentType: 'application/soap+xml; charset=utf-8',
            muteHttpExceptions: true,
            headers: {
                "soapAction": "http://www.ultipro.com/dataservices/bidata/2/IBIDataService/GetReportList"
            }
        }
        console.log("Data Fetching...")
        const response2 = UrlFetchApp.fetch('https://yourhost.ultipro.com/services/BIDataService', options2);
        console.log("Data Fetching Sucessfully...")
            //save report result to spreadsheet.
        console.log("Parsing Data to Spreadsheet...")
        parsereportLIST_SavetoSheet(response2.getContentText(), spreadsheetid, Sheetname);
        console.log('Task Completed')
    }
}




function uKG_fetch_API_ReturnlogonSecret() {
    const UserName = "UserName";
    const apipassword = "apipassword";
    const CustomerAPIKey = "CustomerAPIKey";
    const UserAPIKey = "UserAPIKey";
    const reportLIst_XMLenvlop_login = `
    <s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://www.w3.org/2005/08/addressing">
        <s:Header> <a:Action s:mustUnderstand="1">http://www.ultipro.com/dataservices/bidata/2/IBIDataService/LogOn</a:Action>
            <a:To s:mustUnderstand="1">https://yourhost.ultipro.com/services/BIDataService</a:To>
        </s:Header>  
        <s:Body> 
            <LogOn xmlns="http://www.ultipro.com/dataservices/bidata/2"> 
                <logOnRequest xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
                <UserName>${UserName}</UserName>
                <Password>${apipassword}</Password>
                <ClientAccessKey>${CustomerAPIKey}</ClientAccessKey>
                <UserAccessKey>${UserAPIKey}</UserAccessKey>
                </logOnRequest>
            </LogOn>
        </s:Body>
    </s:Envelope>`
    const options1 = {
        method: 'POST',
        payload: reportLIst_XMLenvlop_login,
        contentType: 'application/soap+xml; charset=utf-8',
        muteHttpExceptions: true,
        headers: {
            "soapAction": "http://www.ultipro.com/dataservices/bidata/2/IBIDataService/LogOn"
        }
    }
    const response = UrlFetchApp.fetch('https://yourhost.ultipro.com/services/BIDataService', options1);
    const responseTEXT = response.getContentText();
    const startindex = responseTEXT.search('<ServiceId>');
    const endindex = responseTEXT.search('</InstanceKey>');
    const logonSecret = responseTEXT.slice(startindex, endindex + '</InstanceKey>'.length);
    const data = {
        responseCode: response.getResponseCode(),
        logonSecret: logonSecret,
    }
    console.log(logonSecret)
    return data
}





//grab report list on BI and export reportname to spreadsheet. This job will done by Monthly.
//aceept parameter as xml content
function parsereportLIST_SavetoSheet(xml, spreadsheetid, Sheetname) {
    let reportARR = [
        ['Report Name', 'Report Path']
    ];
    const root = XmlService.parse(xml).getRootElement();
    const c1 = root.getChildren();
    for (i = 0; i < c1.length; i++) {
        const c2 = c1[i].getChildren()[0].getChildren();
        for (j = 0; j < c2.length; j++) {
            const c3 = c2[j].getChildren()[0].getChildren();
            for (k = 0; k < c3.length; k++) {
                const c4 = c3[k].getChildren(); //=> <ReportName> tag
                let transit = []
                for (p = 0; p < c4.length; p++) {
                    //length 2, reportName, report path
                    if (c4[p].getName() == 'ReportName') {
                        transit.push(c4[p].getValue());
                    } else {
                        const pathnameALL = c4[p].getValue().match(/(?<=\=')(.*?)(?='\])/gm);
                        const path = pathnameALL.slice(0, pathnameALL.length - 1).join(" - ")
                        transit.push(path);
                    }
                }
                reportARR.push(transit)
            }
        }
    }
    if (reportARR.length > 1) {
        Sheets.Spreadsheets.Values.update({
                majorDimension: "ROWS",
                values: reportARR,
            },
            spreadsheetid,
            Sheetname, { valueInputOption: "USER_ENTERED" }
        )
    }

}
