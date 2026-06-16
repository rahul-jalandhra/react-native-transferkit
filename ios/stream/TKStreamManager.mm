#import "TKStreamManager.h"

#import "../events/TransferkitEventEmitter.h"

@interface TKStreamManager ()

@property(nonatomic, strong) NSURLSession *session;
@property(nonatomic, strong) NSURLSessionDataTask *task;

@end

@implementation TKStreamManager

+ (instancetype)shared
{
    static TKStreamManager *sharedInstance = nil;

    static dispatch_once_t onceToken;

    dispatch_once(&onceToken, ^{

        sharedInstance =
            [[TKStreamManager alloc] init];
    });

    return sharedInstance;
}

- (void)startStream:(NSString *)url
             method:(NSString *)method
            headers:(NSDictionary *)headers
               body:(NSString *)body
{

    NSLog(@"startStream called");

    NSURL *requestURL =
        [NSURL URLWithString:url];

    if (!requestURL) {

        NSLog(@"Invalid URL");
        return;
    }

    NSMutableURLRequest *request =
        [NSMutableURLRequest requestWithURL:requestURL];

    request.HTTPMethod = method;

    for (NSString *key in headers) {

        [request setValue:headers[key]
       forHTTPHeaderField:key];
    }

    if (![[method uppercaseString]
          isEqualToString:@"GET"]) {

        request.HTTPBody =
            [body dataUsingEncoding:
                NSUTF8StringEncoding];
    }

    NSURLSessionConfiguration *config =
        [NSURLSessionConfiguration
            defaultSessionConfiguration];

    self.session =
        [NSURLSession sessionWithConfiguration:config
                                      delegate:self
                                 delegateQueue:nil];

    self.task =
        [self.session dataTaskWithRequest:request];

    [self.task resume];
}

- (void)cancelStream
{
    [self.task cancel];

    self.task = nil;

    [[NSNotificationCenter defaultCenter]
        postNotificationName:TransferkitStreamCancelNotification
                      object:nil
                    userInfo:@{
                        @"data": @"cancelled"
                    }];
}

#pragma mark - NSURLSessionDataDelegate

- (void)URLSession:(NSURLSession *)session
          dataTask:(NSURLSessionDataTask *)dataTask
    didReceiveData:(NSData *)data
{

    NSString *chunk =
        [[NSString alloc]
            initWithData:data
                encoding:NSUTF8StringEncoding];

    NSLog(@"Chunk: %@", chunk);

    [[NSNotificationCenter defaultCenter]
        postNotificationName:TransferkitStreamDataNotification
                      object:nil
                    userInfo:@{
                        @"data": chunk ?: @""
                    }];
}

- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
didCompleteWithError:(NSError *)error
{

    if (error) {

        NSLog(@"Stream Error: %@",
              error.localizedDescription);

        [[NSNotificationCenter defaultCenter]
            postNotificationName:TransferkitStreamErrorNotification
                          object:nil
                        userInfo:@{
                            @"data": error.localizedDescription ?: @"Unknown error"
                        }];

    } else {

        NSLog(@"Stream Complete");

        [[NSNotificationCenter defaultCenter]
            postNotificationName:TransferkitStreamCompleteNotification
                          object:nil
                        userInfo:@{
                            @"data": @"done"
                        }];
    }
}

@end